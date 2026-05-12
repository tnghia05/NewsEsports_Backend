"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var KalstropGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.KalstropGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const common_1 = require("@nestjs/common");
const kalstrop_ws_service_1 = require("../services/kalstrop-ws.service");
let KalstropGateway = KalstropGateway_1 = class KalstropGateway {
    kalstropWs;
    server;
    logger = new common_1.Logger(KalstropGateway_1.name);
    clientSubs = new Map();
    constructor(kalstropWs) {
        this.kalstropWs = kalstropWs;
    }
    handleDisconnect(client) {
        const subs = this.clientSubs.get(client.id);
        if (subs) {
            subs.forEach(({ subId, cb }) => this.kalstropWs.unsubscribe(subId, cb));
            this.clientSubs.delete(client.id);
            this.logger.debug(`Client ${client.id} disconnected — cleaned ${subs.size} subs`);
        }
    }
    async handleSubscribeOdds(data, client) {
        const { marketIds } = data;
        if (!Array.isArray(marketIds) || marketIds.length === 0)
            return;
        if (!this.clientSubs.has(client.id)) {
            this.clientSubs.set(client.id, new Map());
        }
        const clientMap = this.clientSubs.get(client.id);
        for (const marketId of marketIds) {
            if (clientMap.has(marketId))
                continue;
            const subId = crypto.randomUUID();
            const cb = (update) => {
                client.emit('odds-updated', { marketId, ...update });
            };
            clientMap.set(marketId, { subId, cb });
            await this.kalstropWs.subscribe(marketId, subId, cb);
            this.logger.debug(`Client ${client.id} subscribed marketId=${marketId}`);
        }
        return { status: 'subscribed', count: marketIds.length };
    }
    handleUnsubscribeOdds(data, client) {
        const clientMap = this.clientSubs.get(client.id);
        if (!clientMap)
            return;
        for (const marketId of data.marketIds ?? []) {
            const entry = clientMap.get(marketId);
            if (entry) {
                this.kalstropWs.unsubscribe(entry.subId, entry.cb);
                clientMap.delete(marketId);
            }
        }
        return { status: 'unsubscribed' };
    }
};
exports.KalstropGateway = KalstropGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], KalstropGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('subscribe-odds'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", Promise)
], KalstropGateway.prototype, "handleSubscribeOdds", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('unsubscribe-odds'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", void 0)
], KalstropGateway.prototype, "handleUnsubscribeOdds", null);
exports.KalstropGateway = KalstropGateway = KalstropGateway_1 = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: [
                'http://localhost:5173',
                'http://localhost:3000',
                'http://127.0.0.1:5173',
                'http://localhost:5175',
            ],
            credentials: true,
        },
        namespace: '/kalstrop',
    }),
    __metadata("design:paramtypes", [kalstrop_ws_service_1.KalstropWsService])
], KalstropGateway);
//# sourceMappingURL=kalstrop.gateway.js.map