import { IoAdapter } from '@nestjs/platform-socket.io';
import type { ServerOptions } from 'socket.io';
import type { INestApplication } from '@nestjs/common';
export declare class CorsIoAdapter extends IoAdapter {
    constructor(app: INestApplication);
    createIOServer(port: number, options?: ServerOptions): any;
}
