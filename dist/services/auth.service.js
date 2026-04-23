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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const bcrypt = __importStar(require("bcryptjs"));
const google_auth_library_1 = require("google-auth-library");
const jwt = __importStar(require("jsonwebtoken"));
const users_service_1 = require("./users.service");
let AuthService = class AuthService {
    usersService;
    config;
    googleClient;
    constructor(usersService, config) {
        this.usersService = usersService;
        this.config = config;
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
        return this.issueToken(user);
    }
    async login(email, password) {
        const user = await this.usersService.findByEmail(email);
        if (!user)
            throw new common_1.UnauthorizedException('Invalid credentials');
        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok)
            throw new common_1.UnauthorizedException('Invalid credentials');
        return this.issueToken(user);
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
            return this.issueToken(bySub);
        const byEmail = await this.usersService.findByEmail(email);
        if (byEmail) {
            const linked = await this.usersService.linkGoogleSub(String(byEmail._id), googleSub, avatarUrl);
            if (!linked)
                throw new common_1.UnauthorizedException('Failed to link account');
            return this.issueToken(linked);
        }
        const passwordHash = await bcrypt.hash(cryptoFallbackPassword(), 10);
        const user = await this.usersService.createUser({
            email,
            passwordHash,
            displayName,
            avatarUrl,
            googleSub,
        });
        return this.issueToken(user);
    }
    verifyJwt(token) {
        const secret = this.config.getOrThrow('JWT_SECRET', { infer: true });
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
    issueToken(userDoc) {
        const secret = this.config.getOrThrow('JWT_SECRET', { infer: true });
        const expiresIn = this.config.getOrThrow('JWT_EXPIRES_IN', { infer: true });
        const payload = {
            sub: String(userDoc._id),
            role: userDoc.role,
        };
        const access_token = jwt.sign(payload, secret, { expiresIn });
        return { access_token, token_type: 'bearer' };
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
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        config_1.ConfigService])
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
//# sourceMappingURL=auth.service.js.map