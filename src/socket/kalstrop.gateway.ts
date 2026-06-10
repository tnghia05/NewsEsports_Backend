import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { KalstropWsService, OddsUpdate } from '../services/kalstrop-ws.service';

interface SubscribeOddsDto {
  marketIds: string[];
}

@WebSocketGateway({
  cors: {
    origin: [
      'http://localhost:5173',
      'http://localhost:3000',
      'http://127.0.0.1:5173',
      'http://localhost:5175',
      'https://tnghia05.github.io',
    ],
    credentials: true,
  },
  namespace: '/kalstrop',
})
export class KalstropGateway implements OnGatewayDisconnect {
  @WebSocketServer() server!: Server;
  private readonly logger = new Logger(KalstropGateway.name);

  private readonly clientSubs = new Map<
    string,
    Map<string, { subId: string; cb: (u: OddsUpdate) => void }>
  >();

  constructor(private readonly kalstropWs: KalstropWsService) {}

  handleDisconnect(client: Socket) {
    const subs = this.clientSubs.get(client.id);
    if (subs) {
      subs.forEach(({ subId, cb }) => this.kalstropWs.unsubscribe(subId, cb));
      this.clientSubs.delete(client.id);
      this.logger.debug(
        `Client ${client.id} disconnected — cleaned ${subs.size} subs`,
      );
    }
  }

  @SubscribeMessage('subscribe-odds')
  async handleSubscribeOdds(
    @MessageBody() data: SubscribeOddsDto,
    @ConnectedSocket() client: Socket,
  ) {
    const { marketIds } = data;
    if (!Array.isArray(marketIds) || marketIds.length === 0) return;

    if (!this.clientSubs.has(client.id)) {
      this.clientSubs.set(client.id, new Map());
    }
    const clientMap = this.clientSubs.get(client.id)!;

    for (const marketId of marketIds) {
      if (clientMap.has(marketId)) continue;

      const subId = crypto.randomUUID();
      const cb = (update: OddsUpdate) => {
        client.emit('odds-updated', { marketId, ...update });
      };

      clientMap.set(marketId, { subId, cb });
      await this.kalstropWs.subscribe(marketId, subId, cb);
      this.logger.debug(`Client ${client.id} subscribed marketId=${marketId}`);
    }

    return { status: 'subscribed', count: marketIds.length };
  }

  @SubscribeMessage('unsubscribe-odds')
  handleUnsubscribeOdds(
    @MessageBody() data: { marketIds: string[] },
    @ConnectedSocket() client: Socket,
  ) {
    const clientMap = this.clientSubs.get(client.id);
    if (!clientMap) return;

    for (const marketId of data.marketIds ?? []) {
      const entry = clientMap.get(marketId);
      if (entry) {
        this.kalstropWs.unsubscribe(entry.subId, entry.cb);
        clientMap.delete(marketId);
      }
    }

    return { status: 'unsubscribed' };
  }
}
