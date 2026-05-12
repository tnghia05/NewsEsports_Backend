"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var KalstropWsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.KalstropWsService = void 0;
const common_1 = require("@nestjs/common");
const crypto = __importStar(require("crypto"));
const WebSocket = require("ws");
const KALSTROP_WS_BASE = 'wss://sportsapi.kalstropservice.com/odds_v1/v1/ws';
let KalstropWsService = KalstropWsService_1 = class KalstropWsService {
    logger = new common_1.Logger(KalstropWsService_1.name);
    ws = null;
    subscriptions = new Map();
    marketToSub = new Map();
    reconnectTimer = null;
    pingTimer = null;
    isConnecting = false;
    onModuleDestroy() {
        this.close();
    }
    buildWsUrl() {
        const clientId = process.env.KALSTROP_CLIENT_ID ?? '';
        const secret = process.env.KALSTROP_SHARED_SECRET ?? '';
        const timestamp = Math.floor(Date.now() / 1000).toString();
        const hashedSecret = crypto.createHash('sha256').update(secret).digest('hex');
        const signature = crypto.createHmac('sha256', hashedSecret).update(`${clientId}:${timestamp}`).digest('hex');
        const auth = encodeURIComponent(`Bearer ${signature}`);
        return `${KALSTROP_WS_BASE}?X-Client-ID=${clientId}&X-Timestamp=${timestamp}&Authorization=${auth}`;
    }
    connect() {
        if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
            return Promise.resolve();
        }
        if (this.isConnecting)
            return Promise.resolve();
        this.isConnecting = true;
        return new Promise((resolve) => {
            const url = this.buildWsUrl();
            this.ws = new WebSocket(url);
            this.ws.on('open', () => {
                this.isConnecting = false;
                this.logger.log('Kalstrop WS connected');
                this.pingTimer = setInterval(() => this.ws?.readyState === WebSocket.OPEN && this.ws.send(JSON.stringify({ type: 'ping' })), 30_000);
                this.resubscribeAll();
                resolve();
            });
            this.ws.on('message', (data) => {
                try {
                    const msg = JSON.parse(data.toString());
                    if (msg.type === 'next' && msg.payload?.data?.sportsMatchDefaultMarketsOddsUpdated) {
                        const update = msg.payload.data.sportsMatchDefaultMarketsOddsUpdated;
                        const subId = msg.id;
                        const cbs = this.subscriptions.get(subId);
                        if (cbs)
                            cbs.forEach(cb => cb(update));
                    }
                }
                catch { }
            });
            this.ws.on('error', (err) => {
                this.logger.warn(`Kalstrop WS error: ${err.message}`);
            });
            this.ws.on('close', (code) => {
                this.isConnecting = false;
                if (this.pingTimer) {
                    clearInterval(this.pingTimer);
                    this.pingTimer = null;
                }
                this.logger.warn(`Kalstrop WS closed (code ${code}), reconnecting in 5s...`);
                this.reconnectTimer = setTimeout(() => this.connect(), 5_000);
                resolve();
            });
        });
    }
    resubscribeAll() {
        this.marketToSub.forEach((subId, marketId) => {
            this.sendSubscribe(subId, [marketId]);
        });
    }
    sendSubscribe(subId, marketIds) {
        if (this.ws?.readyState !== WebSocket.OPEN)
            return;
        this.ws.send(JSON.stringify({
            id: subId,
            type: 'subscribe',
            payload: {
                variables: { marketIds },
                operationName: 'sportsMatchDefaultMarketsOddsUpdated',
                extensions: {},
                query: 'subscription sportsMatchDefaultMarketsOddsUpdated($marketIds: [String!]) { sportsMatchDefaultMarketsOddsUpdated(marketIds: $marketIds) }',
            },
        }));
    }
    async subscribe(marketId, subId, cb) {
        await this.connect();
        if (!this.subscriptions.has(subId)) {
            this.subscriptions.set(subId, new Set());
            this.marketToSub.set(marketId, subId);
            this.sendSubscribe(subId, [marketId]);
        }
        this.subscriptions.get(subId).add(cb);
    }
    unsubscribe(subId, cb) {
        const cbs = this.subscriptions.get(subId);
        if (!cbs)
            return;
        cbs.delete(cb);
        if (cbs.size === 0) {
            this.subscriptions.delete(subId);
            if (this.ws?.readyState === WebSocket.OPEN) {
                this.ws.send(JSON.stringify({ id: subId, type: 'complete' }));
            }
        }
    }
    close() {
        if (this.reconnectTimer)
            clearTimeout(this.reconnectTimer);
        if (this.pingTimer)
            clearInterval(this.pingTimer);
        this.ws?.close(1000);
        this.ws = null;
    }
};
exports.KalstropWsService = KalstropWsService;
exports.KalstropWsService = KalstropWsService = KalstropWsService_1 = __decorate([
    (0, common_1.Injectable)()
], KalstropWsService);
//# sourceMappingURL=kalstrop-ws.service.js.map