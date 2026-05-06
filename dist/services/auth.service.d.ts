import { ConfigService } from '@nestjs/config';
import type { Model } from 'mongoose';
import { UsersService } from './users.service';
import type { JwtPayload, JwtUser } from '../types/auth';
import type { UserDocument } from '../models/user.model';
import { type RefreshTokenDocument } from '../models/refresh-token.model';
export declare class AuthService {
    private readonly usersService;
    private readonly config;
    private readonly refreshTokenModel;
    private googleClient;
    constructor(usersService: UsersService, config: ConfigService, refreshTokenModel: Model<RefreshTokenDocument>);
    register(email: string, password: string, displayName: string): Promise<{
        access_token: string;
        refresh_token: string;
        token_type: "bearer";
        user: JwtUser;
        csrf_token: string;
    }>;
    login(email: string, password: string): Promise<{
        access_token: string;
        refresh_token: string;
        token_type: "bearer";
        user: JwtUser;
        csrf_token: string;
    }>;
    loginWithGoogleIdToken(idToken: string): Promise<{
        access_token: string;
        refresh_token: string;
        token_type: "bearer";
        user: JwtUser;
        csrf_token: string;
    }>;
    rotateRefreshToken(refreshToken: string): Promise<{
        access_token: string;
        refresh_token: string;
        token_type: 'bearer';
    }>;
    revokeRefreshToken(refreshToken: string): Promise<void>;
    verifyJwt(token: string): JwtPayload;
    private issueAuthBundle;
    toJwtUser(userDoc: UserDocument): JwtUser;
    private getAccessExpiresIn;
    private getRefreshExpiresIn;
    private createRefreshToken;
}
