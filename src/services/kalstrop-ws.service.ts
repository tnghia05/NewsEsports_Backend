import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import * as crypto from 'crypto';
import WebSocket = require('ws');

const KALSTROP_WS_BASE = 'wss://sportsapi.kalstropservice.com/odds_v1/v1/ws';

export interface OddsUpdate {
  fixtureId: string;
  fixtureStatus: string;
  markets: {
    id: string;
    status: string;
    selections: {
      id: string;
      oddsNumerator: string;
      oddsDenominator: string;
      probability: string;
      status: string;
    }[];
  }[];
}

type OddsCallback = (update: OddsUpdate) => void;

@Injectable()
export class KalstropWsService implements OnModuleDestroy {
  private readonly logger = new Logger(KalstropWsService.name);
  private ws: WebSocket | null = null;
  private readonly subscriptions = new Map<string, Set<OddsCallback>>();
  private readonly marketToSub = new Map<string, string>();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private pingTimer: ReturnType<typeof setInterval> | null = null;
  private isConnecting = false;

  onModuleDestroy() {
    this.close();
  }

  private buildWsUrl(): string {
    const clientId = process.env.KALSTROP_CLIENT_ID ?? '';
    const secret = process.env.KALSTROP_SHARED_SECRET ?? '';
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const hashedSecret = crypto
      .createHash('sha256')
      .update(secret)
      .digest('hex');
    const signature = crypto
      .createHmac('sha256', hashedSecret)
      .update(`${clientId}:${timestamp}`)
      .digest('hex');
    const auth = encodeURIComponent(`Bearer ${signature}`);
    return `${KALSTROP_WS_BASE}?X-Client-ID=${clientId}&X-Timestamp=${timestamp}&Authorization=${auth}`;
  }

  private connect(): Promise<void> {
    if (
      this.ws &&
      (this.ws.readyState === WebSocket.OPEN ||
        this.ws.readyState === WebSocket.CONNECTING)
    ) {
      return Promise.resolve();
    }
    if (this.isConnecting) return Promise.resolve();
    this.isConnecting = true;

    return new Promise((resolve) => {
      const url = this.buildWsUrl();
      this.ws = new WebSocket(url);

      this.ws.on('open', () => {
        this.isConnecting = false;
        this.logger.log('Kalstrop WS connected');
        this.pingTimer = setInterval(
          () =>
            this.ws?.readyState === WebSocket.OPEN &&
            this.ws.send(JSON.stringify({ type: 'ping' })),
          30_000,
        );
        this.resubscribeAll();
        resolve();
      });

      this.ws.on('message', (data: WebSocket.RawData) => {
        try {
          const msg = JSON.parse(data.toString());
          if (
            msg.type === 'next' &&
            msg.payload?.data?.sportsMatchDefaultMarketsOddsUpdated
          ) {
            const update: OddsUpdate =
              msg.payload.data.sportsMatchDefaultMarketsOddsUpdated;
            const subId: string = msg.id;
            const cbs = this.subscriptions.get(subId);
            if (cbs) cbs.forEach((cb) => cb(update));
          }
        } catch {
          /* ignore parse errors */
        }
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
        this.logger.warn(
          `Kalstrop WS closed (code ${code}), reconnecting in 5s...`,
        );
        this.reconnectTimer = setTimeout(() => this.connect(), 5_000);
        resolve();
      });
    });
  }

  private resubscribeAll() {
    this.marketToSub.forEach((subId, marketId) => {
      this.sendSubscribe(subId, [marketId]);
    });
  }

  private sendSubscribe(subId: string, marketIds: string[]) {
    if (this.ws?.readyState !== WebSocket.OPEN) return;
    this.ws.send(
      JSON.stringify({
        id: subId,
        type: 'subscribe',
        payload: {
          variables: { marketIds },
          operationName: 'sportsMatchDefaultMarketsOddsUpdated',
          extensions: {},
          query:
            'subscription sportsMatchDefaultMarketsOddsUpdated($marketIds: [String!]) { sportsMatchDefaultMarketsOddsUpdated(marketIds: $marketIds) }',
        },
      }),
    );
  }

  async subscribe(
    marketId: string,
    subId: string,
    cb: OddsCallback,
  ): Promise<void> {
    await this.connect();

    if (!this.subscriptions.has(subId)) {
      this.subscriptions.set(subId, new Set());
      this.marketToSub.set(marketId, subId);
      this.sendSubscribe(subId, [marketId]);
    }
    this.subscriptions.get(subId)!.add(cb);
  }

  unsubscribe(subId: string, cb: OddsCallback) {
    const cbs = this.subscriptions.get(subId);
    if (!cbs) return;
    cbs.delete(cb);
    if (cbs.size === 0) {
      this.subscriptions.delete(subId);
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ id: subId, type: 'complete' }));
      }
    }
  }

  private close() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.pingTimer) clearInterval(this.pingTimer);
    this.ws?.close(1000);
    this.ws = null;
  }
}
