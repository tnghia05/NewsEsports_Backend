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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const throttler_1 = require("@nestjs/throttler");
const auth_service_1 = require("../services/auth.service");
const register_dto_1 = require("../dto/auth/register.dto");
const login_dto_1 = require("../dto/auth/login.dto");
const google_login_dto_1 = require("../dto/auth/google-login.dto");
let AuthController = class AuthController {
    authService;
    constructor(authService) {
        this.authService = authService;
    }
    async register(body, res) {
        const data = await this.authService.register(body.email, body.password, body.displayName);
        setAuthCookies(res, data.refresh_token, data.csrf_token);
        return stripCookieFields(data);
    }
    async login(body, res) {
        const data = await this.authService.login(body.email, body.password);
        setAuthCookies(res, data.refresh_token, data.csrf_token);
        return stripCookieFields(data);
    }
    async google(body, res) {
        const data = await this.authService.loginWithGoogleIdToken(body.id_token);
        setAuthCookies(res, data.refresh_token, data.csrf_token);
        return stripCookieFields(data);
    }
    async refresh(req, csrfHeader, res) {
        const refreshToken = req.cookies?.['refresh_token'];
        const csrfCookie = req.cookies?.['csrf_token'];
        if (!refreshToken)
            throw new common_1.UnauthorizedException('Missing refresh token');
        if (!csrfHeader || !csrfCookie || csrfHeader !== csrfCookie) {
            throw new common_1.ForbiddenException('CSRF token mismatch');
        }
        const rotated = await this.authService.rotateRefreshToken(refreshToken);
        setRefreshCookie(res, rotated.refresh_token);
        return rotated;
    }
    async logout(req, csrfHeader, res) {
        const refreshToken = req.cookies?.['refresh_token'];
        const csrfCookie = req.cookies?.['csrf_token'];
        if (csrfHeader && csrfCookie && csrfHeader === csrfCookie && refreshToken) {
            await this.authService.revokeRefreshToken(refreshToken);
        }
        clearAuthCookies(res);
        return { ok: true };
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, common_1.Post)('register'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [register_dto_1.RegisterDto, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "register", null);
__decorate([
    (0, common_1.Post)('login'),
    (0, throttler_1.Throttle)({ default: { limit: 8, ttl: 60 } }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [login_dto_1.LoginDto, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "login", null);
__decorate([
    (0, common_1.Post)('google'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [google_login_dto_1.GoogleLoginDto, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "google", null);
__decorate([
    (0, common_1.Post)('refresh'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Headers)('x-csrf-token')),
    __param(2, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "refresh", null);
__decorate([
    (0, common_1.Post)('logout'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Headers)('x-csrf-token')),
    __param(2, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "logout", null);
exports.AuthController = AuthController = __decorate([
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [auth_service_1.AuthService])
], AuthController);
function stripCookieFields(data) {
    const { refresh_token: _rt, csrf_token: _ct, ...rest } = data;
    return rest;
}
function cookieBaseOptions() {
    const isProd = process.env.NODE_ENV === 'production';
    return {
        secure: isProd,
        sameSite: 'lax',
    };
}
function setRefreshCookie(res, refreshToken) {
    res.cookie('refresh_token', refreshToken, {
        ...cookieBaseOptions(),
        httpOnly: true,
        path: '/api/v1/auth/refresh',
    });
}
function setAuthCookies(res, refreshToken, csrfToken) {
    setRefreshCookie(res, refreshToken);
    res.cookie('csrf_token', csrfToken, {
        ...cookieBaseOptions(),
        httpOnly: false,
        path: '/',
    });
}
function clearAuthCookies(res) {
    res.clearCookie('refresh_token', { path: '/api/v1/auth/refresh' });
    res.clearCookie('csrf_token', { path: '/' });
}
//# sourceMappingURL=auth.controller.js.map