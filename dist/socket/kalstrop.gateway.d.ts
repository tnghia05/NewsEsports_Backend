import { OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { KalstropWsService } from '../services/kalstrop-ws.service';
interface SubscribeOddsDto {
    marketIds: string[];
}
export declare class KalstropGateway implements OnGatewayDisconnect {
    private readonly kalstropWs;
    server: Server;
    private readonly logger;
    private readonly clientSubs;
    constructor(kalstropWs: KalstropWsService);
    handleDisconnect(client: Socket): void;
    handleSubscribeOdds(data: SubscribeOddsDto, client: Socket): Promise<{
        status: string;
        count: number;
    } | undefined>;
    handleUnsubscribeOdds(data: {
        marketIds: string[];
    }, client: Socket): {
        status: string;
    } | undefined;
}
export {};
