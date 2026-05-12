import { OnModuleDestroy } from '@nestjs/common';
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
export declare class KalstropWsService implements OnModuleDestroy {
    private readonly logger;
    private ws;
    private readonly subscriptions;
    private readonly marketToSub;
    private reconnectTimer;
    private pingTimer;
    private isConnecting;
    onModuleDestroy(): void;
    private buildWsUrl;
    private connect;
    private resubscribeAll;
    private sendSubscribe;
    subscribe(marketId: string, subId: string, cb: OddsCallback): Promise<void>;
    unsubscribe(subId: string, cb: OddsCallback): void;
    private close;
}
export {};
