import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import * as jwt from 'jsonwebtoken';
import { createHash, randomBytes } from 'crypto';
import type { Model } from 'mongoose';
import { UsersService } from './users.service';
import type { JwtPayload, JwtUser } from '../types/auth';
import type { UserDocument } from '../models/user.model';
import {
  RefreshTokenModelName,
  type RefreshTokenDocument,
} from '../models/refresh-token.model';

@Injectable()
export class AuthService {
  private googleClient: OAuth2Client;

  constructor(
    private readonly usersService: UsersService,
    private readonly config: ConfigService,
    @InjectModel(RefreshTokenModelName)
    private readonly refreshTokenModel: Model<RefreshTokenDocument>,
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

    return this.issueAuthBundle(user);
  }

  async login(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    return this.issueAuthBundle(user);
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
    if (bySub) return this.issueAuthBundle(bySub);

    const byEmail = await this.usersService.findByEmail(email);
    if (byEmail) {
      const linked = await this.usersService.linkGoogleSub(
        String(byEmail._id),
        googleSub,
        avatarUrl,
      );
      if (!linked) throw new UnauthorizedException('Failed to link account');
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

  async rotateRefreshToken(refreshToken: string): Promise<{
    access_token: string;
    refresh_token: string;
    token_type: 'bearer';
  }> {
    const secret = this.config.getOrThrow<string>('JWT_SECRET', {
      infer: true,
    });
    let decoded: unknown;
    try {
      decoded = jwt.verify(refreshToken, secret);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (!isRefreshJwtPayload(decoded)) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const stored = await this.refreshTokenModel
      .findOne({ userId: decoded.sub, jti: decoded.jti })
      .exec();
    if (!stored) throw new UnauthorizedException('Invalid refresh token');
    if (stored.revokedAt) throw new UnauthorizedException('Refresh token revoked');
    if (stored.expiresAt.getTime() <= Date.now())
      throw new UnauthorizedException('Refresh token expired');

    const presentedHash = sha256(refreshToken);
    if (presentedHash !== stored.tokenHash) {
      // Token reuse / mismatch: revoke defensively
      await this.refreshTokenModel
        .updateOne(
          { _id: stored._id },
          { $set: { revokedAt: new Date() } },
        )
        .exec();
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Rotate
    const next = await this.createRefreshToken(decoded.sub, decoded.role);
    await this.refreshTokenModel
      .updateOne(
        { _id: stored._id },
        {
          $set: {
            revokedAt: new Date(),
            replacedByJti: next.jti,
          },
        },
      )
      .exec();

    const access_token = jwt.sign(
      { sub: decoded.sub, role: decoded.role } satisfies JwtPayload,
      secret,
      { expiresIn: this.getAccessExpiresIn() },
    );

    return {
      access_token,
      refresh_token: next.token,
      token_type: 'bearer',
    };
  }

  async revokeRefreshToken(refreshToken: string): Promise<void> {
    const secret = this.config.getOrThrow<string>('JWT_SECRET', {
      infer: true,
    });
    let decoded: unknown;
    try {
      decoded = jwt.verify(refreshToken, secret);
    } catch {
      // already invalid; nothing to do
      return;
    }
    if (!isRefreshJwtPayload(decoded)) return;

    await this.refreshTokenModel
      .updateOne(
        { userId: decoded.sub, jti: decoded.jti, revokedAt: { $exists: false } },
        { $set: { revokedAt: new Date() } },
      )
      .exec();
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

  private async issueAuthBundle(userDoc: UserDocument): Promise<{
    access_token: string;
    refresh_token: string;
    token_type: 'bearer';
    user: JwtUser;
    csrf_token: string;
  }> {
    const secret = this.config.getOrThrow<string>('JWT_SECRET', {
      infer: true,
    });

    const payload: JwtPayload = {
      sub: String(userDoc._id),
      role: userDoc.role,
    };

    const access_token = jwt.sign(payload, secret, {
      expiresIn: this.getAccessExpiresIn(),
    });
    const refresh = await this.createRefreshToken(payload.sub, payload.role);
    const csrf_token = randomBytes(24).toString('hex');

    return {
      access_token,
      refresh_token: refresh.token,
      token_type: 'bearer',
      user: this.toJwtUser(userDoc),
      csrf_token,
    };
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

  private getAccessExpiresIn(): jwt.SignOptions['expiresIn'] {
    return this.config.getOrThrow<string>('JWT_EXPIRES_IN', {
      infer: true,
    }) as jwt.SignOptions['expiresIn'];
  }

  private getRefreshExpiresIn(): jwt.SignOptions['expiresIn'] {
    const v = this.config.get<string>('JWT_REFRESH_EXPIRES_IN', {
      infer: true,
    });
    return (v ?? '30d') as jwt.SignOptions['expiresIn'];
  }

  private async createRefreshToken(
    userId: string,
    role: 'user' | 'admin',
  ): Promise<{ jti: string; token: string; expiresAt: Date }> {
    const secret = this.config.getOrThrow<string>('JWT_SECRET', {
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

type RefreshJwtPayload = JwtPayload & { typ: 'refresh'; jti: string };

function isRefreshJwtPayload(v: unknown): v is RefreshJwtPayload {
  if (!v || typeof v !== 'object') return false;
  const obj = v as Record<string, unknown>;
  return (
    typeof obj['sub'] === 'string' &&
    (obj['role'] === 'user' || obj['role'] === 'admin') &&
    obj['typ'] === 'refresh' &&
    typeof obj['jti'] === 'string' &&
    obj['jti'].length >= 10
  );
}

function sha256(v: string): string {
  return createHash('sha256').update(v).digest('hex');
}

function createRefreshJwt(
  userId: string,
  role: 'user' | 'admin',
  secret: string,
  expiresIn: jwt.SignOptions['expiresIn'],
): { jti: string; token: string; expiresAt: Date } {
  const jti = randomBytes(18).toString('hex');
  const token = jwt.sign(
    { sub: userId, role, typ: 'refresh', jti } satisfies RefreshJwtPayload,
    secret,
    { expiresIn },
  );

  const ttlMs = expiresInToMs(expiresIn);
  const expiresAt = new Date(Date.now() + ttlMs);
  return { jti, token, expiresAt };
}

function expiresInToMs(expiresIn: jwt.SignOptions['expiresIn']): number {
  if (typeof expiresIn === 'number') return expiresIn * 1000;
  if (typeof expiresIn !== 'string') return 30 * 24 * 60 * 60 * 1000;

  const m = /^(\d+)\s*([smhd])$/.exec(expiresIn.trim());
  if (!m) return 30 * 24 * 60 * 60 * 1000;
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
