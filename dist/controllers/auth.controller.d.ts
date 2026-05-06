import { AuthService } from '../services/auth.service';
import { RegisterDto } from '../dto/auth/register.dto';
import { LoginDto } from '../dto/auth/login.dto';
import { GoogleLoginDto } from '../dto/auth/google-login.dto';
import type { Request, Response } from 'express';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    register(body: RegisterDto, res: Response): Promise<Omit<{
        access_token: string;
        refresh_token: string;
        token_type: "bearer";
        user: import("../types/auth").JwtUser;
        csrf_token: string;
    }, "refresh_token" | "csrf_token">>;
    login(body: LoginDto, res: Response): Promise<Omit<{
        access_token: string;
        refresh_token: string;
        token_type: "bearer";
        user: import("../types/auth").JwtUser;
        csrf_token: string;
    }, "refresh_token" | "csrf_token">>;
    google(body: GoogleLoginDto, res: Response): Promise<Omit<{
        access_token: string;
        refresh_token: string;
        token_type: "bearer";
        user: import("../types/auth").JwtUser;
        csrf_token: string;
    }, "refresh_token" | "csrf_token">>;
    refresh(req: Request, csrfHeader: string | undefined, res: Response): Promise<{
        access_token: string;
        refresh_token: string;
        token_type: "bearer";
    }>;
    logout(req: Request, csrfHeader: string | undefined, res: Response): Promise<{
        ok: boolean;
    }>;
}
