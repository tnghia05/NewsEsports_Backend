import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import * as jwt from 'jsonwebtoken';
import { UsersService } from './users.service';
import type { JwtPayload, JwtUser } from '../types/auth';
import type { UserDocument } from '../models/user.model';

@Injectable()
export class AuthService {
  private googleClient: OAuth2Client;

  constructor(
    private readonly usersService: UsersService,
    private readonly config: ConfigService,
  ) {
    const googleClientId = this.config.getOrThrow<string>('GOOGLE_CLIENT_ID', {
      infer: true,
    });
    this.googleClient = new OAuth2Client(googleClientId);
  }

  async register(email: string, password: string, displayName: string) {
    const existing = await this.usersService.findByEmail(email);
    if (existing) {
      throw new ConflictException('Email already exists');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await this.usersService.createUser({
      email,
      passwordHash,
      displayName,
    });

    return this.issueToken(user);
  }

  async login(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    return this.issueToken(user);
  }

  async loginWithGoogleIdToken(idToken: string) {
    const ticket = await this.googleClient.verifyIdToken({
      idToken,
      audience: this.config.getOrThrow<string>('GOOGLE_CLIENT_ID', {
        infer: true,
      }),
    });
    const payload = ticket.getPayload();
    if (!payload?.sub || !payload.email) {
      throw new UnauthorizedException('Invalid Google token');
    }

    const googleSub = payload.sub;
    const email = payload.email;
    const displayName = payload.name ?? email.split('@')[0];
    const avatarUrl = payload.picture ?? undefined;

    const bySub = await this.usersService.findByGoogleSub(googleSub);
    if (bySub) return this.issueToken(bySub);

    const byEmail = await this.usersService.findByEmail(email);
    if (byEmail) {
      const linked = await this.usersService.linkGoogleSub(
        String(byEmail._id),
        googleSub,
        avatarUrl,
      );
      if (!linked) throw new UnauthorizedException('Failed to link account');
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

  verifyJwt(token: string): JwtPayload {
    const secret = this.config.getOrThrow<string>('JWT_SECRET', {
      infer: true,
    });
    try {
      const decoded = jwt.verify(token, secret);
      if (!isJwtPayload(decoded))
        throw new UnauthorizedException('Invalid token');
      return decoded;
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }

  private issueToken(userDoc: UserDocument): {
    access_token: string;
    token_type: 'bearer';
  } {
    const secret = this.config.getOrThrow<string>('JWT_SECRET', {
      infer: true,
    });
    const expiresIn = this.config.getOrThrow<string>('JWT_EXPIRES_IN', {
      infer: true,
    }) as jwt.SignOptions['expiresIn'];

    const payload: JwtPayload = {
      sub: String(userDoc._id),
      role: userDoc.role,
    };

    const access_token = jwt.sign(payload, secret, { expiresIn });
    return { access_token, token_type: 'bearer' };
  }

  toJwtUser(userDoc: UserDocument): JwtUser {
    return {
      id: String(userDoc._id),
      email: userDoc.email,
      displayName: userDoc.displayName,
      role: userDoc.role,
      avatarUrl: userDoc.avatarUrl ?? undefined,
    };
  }
}

function cryptoFallbackPassword(): string {
  // We only need a non-guessable placeholder for accounts created via Google login.
  // Not returned anywhere, and local password login can be added later if needed.
  return `google:${Date.now()}:${Math.random().toString(16).slice(2)}`;
}

function isJwtPayload(v: unknown): v is JwtPayload {
  if (!v || typeof v !== 'object') return false;
  const obj = v as Record<string, unknown>;
  return (
    typeof obj['sub'] === 'string' &&
    (obj['role'] === 'user' || obj['role'] === 'admin')
  );
}
