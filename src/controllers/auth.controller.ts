import {
  Body,
  Controller,
  ForbiddenException,
  Headers,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from '../services/auth.service';
import { RegisterDto } from '../dto/auth/register.dto';
import { LoginDto } from '../dto/auth/login.dto';
import { GoogleLoginDto } from '../dto/auth/google-login.dto';
import { RefreshDto } from '../dto/auth/refresh.dto';
import type { Request, Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(
    @Body() body: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const data = await this.authService.register(
      body.email,
      body.password,
      body.displayName,
    );
    setAuthCookies(res, data.refresh_token, data.csrf_token);
    return stripCookieFields(data);
  }

  @Post('login')
  @Throttle({ default: { limit: 8, ttl: 60 } })
  async login(
    @Body() body: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const data = await this.authService.login(body.email, body.password);
    setAuthCookies(res, data.refresh_token, data.csrf_token);
    return stripCookieFields(data);
  }

  @Post('google')
  async google(
    @Body() body: GoogleLoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const data = await this.authService.loginWithGoogleIdToken(body.id_token);
    setAuthCookies(res, data.refresh_token, data.csrf_token);
    return stripCookieFields(data);
  }

  @Post('refresh')
  async refresh(
    @Req() req: Request,
    @Headers('x-csrf-token') csrfHeader: string | undefined,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.['refresh_token'];
    const csrfCookie = req.cookies?.['csrf_token'];
    if (!refreshToken) throw new UnauthorizedException('Missing refresh token');
    if (!csrfHeader || !csrfCookie || csrfHeader !== csrfCookie) {
      throw new ForbiddenException('CSRF token mismatch');
    }

    const rotated = await this.authService.rotateRefreshToken(refreshToken);
    // Keep CSRF the same; rotate refresh cookie only
    setRefreshCookie(res, rotated.refresh_token);
    return rotated;
  }

  @Post('logout')
  async logout(
    @Req() req: Request,
    @Headers('x-csrf-token') csrfHeader: string | undefined,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.['refresh_token'];
    const csrfCookie = req.cookies?.['csrf_token'];
    if (csrfHeader && csrfCookie && csrfHeader === csrfCookie && refreshToken) {
      await this.authService.revokeRefreshToken(refreshToken);
    }
    clearAuthCookies(res);
    return { ok: true };
  }
}

function stripCookieFields<
  T extends { refresh_token: string; csrf_token: string },
>(data: T): Omit<T, 'refresh_token' | 'csrf_token'> {
  const { refresh_token: _rt, csrf_token: _ct, ...rest } = data;
  return rest;
}

function cookieBaseOptions() {
  const isProd = process.env.NODE_ENV === 'production';
  return {
    secure: isProd,
    sameSite: 'lax' as const,
  };
}

function setRefreshCookie(res: Response, refreshToken: string) {
  res.cookie('refresh_token', refreshToken, {
    ...cookieBaseOptions(),
    httpOnly: true,
    path: '/api/v1/auth/refresh',
  });
}

function setAuthCookies(
  res: Response,
  refreshToken: string,
  csrfToken: string,
) {
  setRefreshCookie(res, refreshToken);
  res.cookie('csrf_token', csrfToken, {
    ...cookieBaseOptions(),
    httpOnly: false,
    path: '/',
  });
}

function clearAuthCookies(res: Response) {
  res.clearCookie('refresh_token', { path: '/api/v1/auth/refresh' });
  res.clearCookie('csrf_token', { path: '/' });
}
