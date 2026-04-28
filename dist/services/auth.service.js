"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const mongoose_1 = require("@nestjs/mongoose");
const bcrypt = __importStar(require("bcryptjs"));
const google_auth_library_1 = require("google-auth-library");
const jwt = __importStar(require("jsonwebtoken"));
const crypto_1 = require("crypto");
const users_service_1 = require("./users.service");
const refresh_token_model_1 = require("../models/refresh-token.model");
let AuthService = class AuthService {
    usersService;
    config;
    refreshTokenModel;
    googleClient;
    constructor(usersService, config, refreshTokenModel) {
        this.usersService = usersService;
        this.config = config;
        this.refreshTokenModel = refreshTokenModel;
        const googleClientId = this.config.getOrThrow('GOOGLE_CLIENT_ID', {
            infer: true,
        });
        this.googleClient = new google_auth_library_1.OAuth2Client(googleClientId);
    }
    async register(email, password, displayName) {
        const existing = await this.usersService.findByEmail(email);
        if (existing) {
            throw new common_1.ConflictException('Email already exists');
        }
        const passwordHash = await bcrypt.hash(password, 10);
        const user = await this.usersService.createUser({
            email,
            passwordHash,
            displayName,
        });
        return this.issueAuthBundle(user);
    }
    async login(email, password) {
        const user = await this.usersService.findByEmail(email);
        if (!user)
            throw new common_1.UnauthorizedException('Invalid credentials');
        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok)
            throw new common_1.UnauthorizedException('Invalid credentials');
        return this.issueAuthBundle(user);
    }
    async loginWithGoogleIdToken(idToken) {
        const ticket = await this.googleClient.verifyIdToken({
            idToken,
            audience: this.config.getOrThrow('GOOGLE_CLIENT_ID', {
                infer: true,
            }),
        });
        const payload = ticket.getPayload();
        if (!payload?.sub || !payload.email) {
            throw new common_1.UnauthorizedException('Invalid Google token');
        }
        const googleSub = payload.sub;
        const email = payload.email;
        const displayName = payload.name ?? email.split('@')[0];
        const avatarUrl = payload.picture ?? undefined;
        const bySub = await this.usersService.findByGoogleSub(googleSub);
        if (bySub)
            return this.issueAuthBundle(bySub);
        const byEmail = await this.usersService.findByEmail(email);
        if (byEmail) {
            const linked = await this.usersService.linkGoogleSub(String(byEmail._id), googleSub, avatarUrl);
            if (!linked)
                throw new common_1.UnauthorizedException('Failed to link account');
            return this.issueAuthBundle(linked);
        }
        const passwordHash = await bcrypt.hash(cryptoFallbackPassword(), 10);
        const user = await this.usersService.createUser({
            email,
            passwordHash,
            displayName,
            avatarUrl,
            googleSub,
        });
        return this.issueAuthBundle(user);
    }
    async rotateRefreshToken(refreshToken) {
        const secret = this.config.getOrThrow('JWT_SECRET', {
            infer: true,
        });
        let decoded;
        try {
            decoded = jwt.verify(refreshToken, secret);
        }
        catch {
            throw new common_1.UnauthorizedException('Invalid refresh token');
        }
        if (!isRefreshJwtPayload(decoded)) {
            throw new common_1.UnauthorizedException('Invalid refresh token');
        }
        const stored = await this.refreshTokenModel
            .findOne({ userId: decoded.sub, jti: decoded.jti })
            .exec();
        if (!stored)
            throw new common_1.UnauthorizedException('Invalid refresh token');
        if (stored.revokedAt)
            throw new common_1.UnauthorizedException('Refresh token revoked');
        if (stored.expiresAt.getTime() <= Date.now())
            throw new common_1.UnauthorizedException('Refresh token expired');
        const presentedHash = sha256(refreshToken);
        if (presentedHash !== stored.tokenHash) {
            await this.refreshTokenModel
                .updateOne({ _id: stored._id }, { $set: { revokedAt: new Date() } })
                .exec();
            throw new common_1.UnauthorizedException('Invalid refresh token');
        }
        const next = await this.createRefreshToken(decoded.sub, decoded.role);
        await this.refreshTokenModel
            .updateOne({ _id: stored._id }, {
            $set: {
                revokedAt: new Date(),
                replacedByJti: next.jti,
            },
        })
            .exec();
        const access_token = jwt.sign({ sub: decoded.sub, role: decoded.role }, secret, { expiresIn: this.getAccessExpiresIn() });
        return {
            access_token,
            refresh_token: next.token,
            token_type: 'bearer',
        };
    }
    async revokeRefreshToken(refreshToken) {
        const secret = this.config.getOrThrow('JWT_SECRET', {
            infer: true,
        });
        let decoded;
        try {
            decoded = jwt.verify(refreshToken, secret);
        }
        catch {
            return;
        }
        if (!isRefreshJwtPayload(decoded))
            return;
        await this.refreshTokenModel
            .updateOne({
            userId: decoded.sub,
            jti: decoded.jti,
            revokedAt: { $exists: false },
        }, { $set: { revokedAt: new Date() } })
            .exec();
    }
    verifyJwt(token) {
        const secret = this.config.getOrThrow('JWT_SECRET', {
            infer: true,
        });
        try {
            const decoded = jwt.verify(token, secret);
            if (!isJwtPayload(decoded))
                throw new common_1.UnauthorizedException('Invalid token');
            return decoded;
        }
        catch {
            throw new common_1.UnauthorizedException('Invalid token');
        }
    }
    async issueAuthBundle(userDoc) {
        const secret = this.config.getOrThrow('JWT_SECRET', {
            infer: true,
        });
        const payload = {
            sub: String(userDoc._id),
            role: userDoc.role,
        };
        const access_token = jwt.sign(payload, secret, {
            expiresIn: this.getAccessExpiresIn(),
        });
        const refresh = await this.createRefreshToken(payload.sub, payload.role);
        const csrf_token = (0, crypto_1.randomBytes)(24).toString('hex');
        return {
            access_token,
            refresh_token: refresh.token,
            token_type: 'bearer',
            user: this.toJwtUser(userDoc),
            csrf_token,
        };
    }
    toJwtUser(userDoc) {
        return {
            id: String(userDoc._id),
            email: userDoc.email,
            displayName: userDoc.displayName,
            role: userDoc.role,
            avatarUrl: userDoc.avatarUrl ?? undefined,
        };
    }
    getAccessExpiresIn() {
        return this.config.getOrThrow('JWT_EXPIRES_IN', {
            infer: true,
        });
    }
    getRefreshExpiresIn() {
        const v = this.config.get('JWT_REFRESH_EXPIRES_IN', {
            infer: true,
        });
        return (v ?? '30d');
    }
    async createRefreshToken(userId, role) {
        const secret = this.config.getOrThrow('JWT_SECRET', {
            infer: true,
        });
        const expiresIn = this.getRefreshExpiresIn();
        const { jti, token, expiresAt } = createRefreshJwt(userId, role, secret, expiresIn);
        await this.refreshTokenModel.create({
            userId,
            jti,
            tokenHash: sha256(token),
            expiresAt,
        });
        return { jti, token, expiresAt };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, mongoose_1.InjectModel)(refresh_token_model_1.RefreshTokenModelName)),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        config_1.ConfigService, Function])
], AuthService);
function cryptoFallbackPassword() {
    return `google:${Date.now()}:${Math.random().toString(16).slice(2)}`;
}
function isJwtPayload(v) {
    if (!v || typeof v !== 'object')
        return false;
    const obj = v;
    return (typeof obj['sub'] === 'string' &&
        (obj['role'] === 'user' || obj['role'] === 'admin'));
}
function isRefreshJwtPayload(v) {
    if (!v || typeof v !== 'object')
        return false;
    const obj = v;
    return (typeof obj['sub'] === 'string' &&
        (obj['role'] === 'user' || obj['role'] === 'admin') &&
        obj['typ'] === 'refresh' &&
        typeof obj['jti'] === 'string' &&
        obj['jti'].length >= 10);
}
function sha256(v) {
    return (0, crypto_1.createHash)('sha256').update(v).digest('hex');
}
function createRefreshJwt(userId, role, secret, expiresIn) {
    const jti = (0, crypto_1.randomBytes)(18).toString('hex');
    const token = jwt.sign({ sub: userId, role, typ: 'refresh', jti }, secret, { expiresIn });
    const ttlMs = expiresInToMs(expiresIn);
    const expiresAt = new Date(Date.now() + ttlMs);
    return { jti, token, expiresAt };
}
function expiresInToMs(expiresIn) {
    if (typeof expiresIn === 'number')
        return expiresIn * 1000;
    if (typeof expiresIn !== 'string')
        return 30 * 24 * 60 * 60 * 1000;
    const m = /^(\d+)\s*([smhd])$/.exec(expiresIn.trim());
    if (!m)
        return 30 * 24 * 60 * 60 * 1000;
    const n = Number(m[1]);
    const unit = m[2];
    switch (unit) {
        case 's':
            return n * 1000;
        case 'm':
            return n * 60 * 1000;
        case 'h':
            return n * 60 * 60 * 1000;
        case 'd':
            return n * 24 * 60 * 60 * 1000;
        default:
            return 30 * 24 * 60 * 60 * 1000;
    }
}
//# sourceMappingURL=auth.service.js.map