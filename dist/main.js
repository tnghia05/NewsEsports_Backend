"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const app_module_1 = require("./app.module");
const constants_1 = require("./config/constants");
const http_exception_filter_1 = require("./filters/http-exception.filter");
const cors_io_adapter_1 = require("./socket/cors-io.adapter");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.enableCors({
        origin: (origin, callback) => {
            if (!origin)
                return callback(null, true);
            if (origin === 'http://localhost:5173' ||
                origin === 'http://localhost:3000' ||
                origin === 'http://127.0.0.1:5173' ||
                origin === 'http://127.0.0.1:56231' ||
                origin === 'http://localhost:5623' ||
                origin === 'http://localhost:5000' ||
                origin === 'http://localhost:5175' ||
                origin === 'http://127.0.0.1:5175' ||
                origin === 'https://tnghia05.github.io') {
                return callback(null, true);
            }
            return callback(new Error(`CORS blocked for origin: ${origin}`), false);
        },
        credentials: true,
    });
    app.use((0, cookie_parser_1.default)());
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
    }));
    app.useGlobalFilters(new http_exception_filter_1.HttpExceptionFilter());
    app.useWebSocketAdapter(new cors_io_adapter_1.CorsIoAdapter(app));
    await app.listen(process.env.PORT ? Number(process.env.PORT) : constants_1.DEFAULT_PORT);
}
void bootstrap();
//# sourceMappingURL=main.js.map