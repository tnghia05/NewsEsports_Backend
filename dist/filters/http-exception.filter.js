"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpExceptionFilter = void 0;
const common_1 = require("@nestjs/common");
let HttpExceptionFilter = class HttpExceptionFilter {
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const res = ctx.getResponse();
        if (exception instanceof common_1.HttpException) {
            const status = exception.getStatus();
            const response = exception.getResponse();
            const details = typeof response === 'string' ? undefined : response;
            const message = extractMessage(response, exception.message);
            const body = {
                error: {
                    code: statusToCode(status),
                    message,
                    details,
                },
            };
            res.status(status).json(body);
            return;
        }
        const body = {
            error: {
                code: 'INTERNAL_SERVER_ERROR',
                message: 'Internal server error',
            },
        };
        res.status(common_1.HttpStatus.INTERNAL_SERVER_ERROR).json(body);
    }
};
exports.HttpExceptionFilter = HttpExceptionFilter;
exports.HttpExceptionFilter = HttpExceptionFilter = __decorate([
    (0, common_1.Catch)()
], HttpExceptionFilter);
function statusToCode(status) {
    switch (status) {
        case 400:
            return 'BAD_REQUEST';
        case 401:
            return 'UNAUTHORIZED';
        case 403:
            return 'FORBIDDEN';
        case 404:
            return 'NOT_FOUND';
        case 409:
            return 'CONFLICT';
        case 422:
            return 'VALIDATION_ERROR';
        case 429:
            return 'RATE_LIMITED';
        default:
            return 'HTTP_ERROR';
    }
}
function extractMessage(response, fallback) {
    if (typeof response === 'string')
        return response;
    if (!isRecord(response))
        return fallback;
    const msg = response['message'];
    if (typeof msg === 'string')
        return msg;
    if (Array.isArray(msg) && msg.every((x) => typeof x === 'string')) {
        return msg.join(', ');
    }
    return fallback;
}
function isRecord(v) {
    return typeof v === 'object' && v !== null;
}
//# sourceMappingURL=http-exception.filter.js.map