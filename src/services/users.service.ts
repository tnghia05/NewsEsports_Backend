import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { UserModelName, type UserDocument } from '../models/user.model';

type CreateUserInput = {
  email: string;
  passwordHash: string;
  displayName: string;
  avatarUrl?: string;
  googleSub?: string;
  role?: 'user' | 'admin';
};

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(UserModelName) private readonly userModel: Model<UserDocument>,
  ) {}

  findById(id: string) {
    return this.userModel.findById(id).exec();
  }

  findByEmail(email: string) {
    return this.userModel.findOne({ email: email.toLowerCase().trim() }).exec();
  }

  findByGoogleSub(googleSub: string) {
    return this.userModel.findOne({ googleSub }).exec();
  }

  async createUser(input: CreateUserInput) {
    const doc = await this.userModel.create({
      email: input.email.toLowerCase().trim(),
      passwordHash: input.passwordHash,
      displayName: input.displayName.trim(),
      avatarUrl: input.avatarUrl,
      googleSub: input.googleSub,
      role: input.role ?? 'user',
    });
    return doc;
  }

  async linkGoogleSub(userId: string, googleSub: string, avatarUrl?: string) {
    return this.userModel
      .findByIdAndUpdate(
        userId,
        { $set: { googleSub, ...(avatarUrl ? { avatarUrl } : {}) } },
        { returnDocument: 'after' },
      )
      .exec();
  }

  async updateUser(userId: string, update: { displayName?: string; avatarUrl?: string }) {
    const patch: any = {};
    if (update.displayName !== undefined) patch.displayName = update.displayName.trim();
    if (update.avatarUrl !== undefined) patch.avatarUrl = update.avatarUrl.trim();

    return this.userModel
      .findByIdAndUpdate(userId, { $set: patch }, { returnDocument: 'after' })
      .exec();
  }

  // ── Ban management ────────────────────────────────────────────────

  /** Ban a user. durationDays = 0 means permanent (year 2099). */
  async banUser(userId: string, opts: { durationDays: number; reason: string }) {
    const PERMANENT_DATE = new Date('2099-01-01T00:00:00Z');
    const banUntil =
      opts.durationDays === 0
        ? PERMANENT_DATE
        : new Date(Date.now() + opts.durationDays * 24 * 60 * 60 * 1000);

    return this.userModel
      .findByIdAndUpdate(
        userId,
        { $set: { banUntil, banReason: opts.reason.trim() } },
        { returnDocument: 'after' },
      )
      .exec();
  }

  /** Remove ban from a user. */
  async unbanUser(userId: string) {
    return this.userModel
      .findByIdAndUpdate(
        userId,
        { $set: { banUntil: null, banReason: null } },
        { returnDocument: 'after' },
      )
      .exec();
  }

  /** List users with high toxic strike count (for admin review panel). */
  async listToxicUsers(opts: { page: number; limit: number; minStrikes?: number }) {
    const page = Math.max(1, opts.page || 1);
    const limit = Math.min(100, Math.max(1, opts.limit || 20));
    const skip = (page - 1) * limit;
    const minStrikes = opts.minStrikes ?? 1;

    const filter = { toxicStrikeCount: { $gte: minStrikes } };
    const [total, items] = await Promise.all([
      this.userModel.countDocuments(filter).exec(),
      this.userModel
        .find(filter)
        .select({ passwordHash: 0, googleSub: 0 })
        .sort({ toxicStrikeCount: -1, updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
    ]);

    return {
      items: items.map((u) => ({
        _id: u._id,
        displayName: u.displayName,
        email: u.email,
        avatarUrl: u.avatarUrl,
        toxicStrikeCount: u.toxicStrikeCount ?? 0,
        banUntil: u.banUntil ?? null,
        banReason: u.banReason ?? null,
        isBanned: u.banUntil ? new Date() < new Date(u.banUntil) : false,
        isPermanent: u.banUntil
          ? new Date(u.banUntil).getFullYear() >= 2099
          : false,
      })),
      page,
      limit,
      total,
      hasMore: skip + items.length < total,
    };
  }

  /** Check if user is currently banned (used by CommentsService guard). */
  async isBanned(userId: string): Promise<{ banned: boolean; until?: Date; reason?: string }> {
    const user = await this.userModel
      .findById(userId)
      .select({ banUntil: 1, banReason: 1 })
      .lean()
      .exec();
    if (!user?.banUntil) return { banned: false };
    const now = new Date();
    if (new Date(user.banUntil) > now) {
      return { banned: true, until: user.banUntil, reason: user.banReason ?? undefined };
    }
    return { banned: false };
  }
}
