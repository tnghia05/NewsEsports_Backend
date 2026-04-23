import { AuthService } from '../services/auth.service';
import { RegisterDto } from '../dto/auth/register.dto';
import { LoginDto } from '../dto/auth/login.dto';
import { GoogleLoginDto } from '../dto/auth/google-login.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    register(body: RegisterDto): Promise<{
        access_token: string;
        token_type: "bearer";
    }>;
    login(body: LoginDto): Promise<{
        access_token: string;
        token_type: "bearer";
    }>;
    google(body: GoogleLoginDto): Promise<{
        access_token: string;
        token_type: "bearer";
    }>;
}
