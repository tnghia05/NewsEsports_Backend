import { ConfigService } from '@nestjs/config';
import { UsersService } from './users.service';
import type { JwtPayload, JwtUser } from '../types/auth';
import type { UserDocument } from '../models/user.model';
export declare class AuthService {
    private readonly usersService;
    private readonly config;
    private googleClient;
    constructor(usersService: UsersService, config: ConfigService);
    register(email: string, password: string, displayName: string): Promise<{
        access_token: string;
        token_type: "bearer";
    }>;
    login(email: string, password: string): Promise<{
        access_token: string;
        token_type: "bearer";
    }>;
    loginWithGoogleIdToken(idToken: string): Promise<{
        access_token: string;
        token_type: "bearer";
    }>;
    verifyJwt(token: string): JwtPayload;
    private issueToken;
    toJwtUser(userDoc: UserDocument): JwtUser;
}
