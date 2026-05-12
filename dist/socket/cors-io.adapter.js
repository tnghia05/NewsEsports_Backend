"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CorsIoAdapter = void 0;
const platform_socket_io_1 = require("@nestjs/platform-socket.io");
const ALLOWED_ORIGINS = [
    'http://localhost:5173',
    'http://localhost:5175',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5175',
];
class CorsIoAdapter extends platform_socket_io_1.IoAdapter {
    constructor(app) {
        super(app);
    }
    createIOServer(port, options) {
        return super.createIOServer(port, {
            ...options,
            cors: {
                origin: ALLOWED_ORIGINS,
                credentials: true,
            },
            transports: ['websocket', 'polling'],
        });
    }
}
exports.CorsIoAdapter = CorsIoAdapter;
//# sourceMappingURL=cors-io.adapter.js.map