import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { FollowModelName, type FollowDocument } from '../models/follow.model';
import { UserModelName, type UserDocument } from '../models/user.model';
import { NotificationsService } from './notifications.service';

@Injectable()
export class FollowsService {
  constructor(
    @InjectModel(FollowModelName)
    private readonly followModel: Model<FollowDocument>,
    @InjectModel(UserModelName)
    private readonly userModel: Model<UserDocument>,
    private readonly notificationsService: NotificationsService,
  ) {}

  async listFolloweeIds(followerId: string): Promise<string[]> {
    const rows = await this.followModel
      .find({ followerId })
      .select({ followeeId: 1 })
      .lean()
      .exec();
    return rows.map((r) => r.followeeId);
  }

  async toggleFollow(followerId: string, followeeId: string): Promise<{ following: boolean }> {
    if (followerId === followeeId) return { following: false };

    const existing = await this.followModel
      .findOne({ followerId, followeeId })
      .exec();
    if (existing) {
      await existing.deleteOne();
      return { following: false };
    }

    await this.followModel.create({ followerId, followeeId });
    await this.notificationsService.create({
      userId: followeeId,
      actorId: followerId,
      type: 'follow',
    });
    return { following: true };
  }

  async isFollowing(followerId: string, followeeId: string): Promise<boolean> {
    if (followerId === followeeId) return false;
    const exists = await this.followModel.exists({ followerId, followeeId });
    return Boolean(exists);
  }

  async listFollowers(
    followeeId: string,
    opts: { page: number; limit: number },
  ): Promise<{ items: { id: string; displayName: string; avatarUrl?: string }[]; page: number; limit: number; total: number; hasMore: boolean }> {
    const page = Math.max(1, Number(opts.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(opts.limit) || 20));
    const skip = (page - 1) * limit;

    const filter = { followeeId };
    const total = await this.followModel.countDocuments(filter).exec();
    const rows = await this.followModel
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()
      .exec();

    const ids = rows.map((r) => r.followerId);
    const users = await this.userModel
      .find({ _id: { $in: ids } })
      .select({ displayName: 1, avatarUrl: 1 })
      .lean()
      .exec();
    const byId = new Map(users.map((u: any) => [String(u._id), u]));

    return {
      items: ids
        .map((id) => {
          const u: any = byId.get(String(id));
          if (!u) return undefined;
          return { id: String(id), displayName: u.displayName, avatarUrl: u.avatarUrl ?? undefined };
        })
        .filter(Boolean) as { id: string; displayName: string; avatarUrl?: string }[],
      page,
      limit,
      total,
      hasMore: skip + rows.length < total,
    };
  }

  async listFollowing(
    followerId: string,
    opts: { page: number; limit: number },
  ): Promise<{ items: { id: string; displayName: string; avatarUrl?: string }[]; page: number; limit: number; total: number; hasMore: boolean }> {
    const page = Math.max(1, Number(opts.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(opts.limit) || 20));
    const skip = (page - 1) * limit;

    const filter = { followerId };
    const total = await this.followModel.countDocuments(filter).exec();
    const rows = await this.followModel
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()
      .exec();

    const ids = rows.map((r) => r.followeeId);
    const users = await this.userModel
      .find({ _id: { $in: ids } })
      .select({ displayName: 1, avatarUrl: 1 })
      .lean()
      .exec();
    const byId = new Map(users.map((u: any) => [String(u._id), u]));

    return {
      items: ids
        .map((id) => {
          const u: any = byId.get(String(id));
          if (!u) return undefined;
          return { id: String(id), displayName: u.displayName, avatarUrl: u.avatarUrl ?? undefined };
        })
        .filter(Boolean) as { id: string; displayName: string; avatarUrl?: string }[],
      page,
      limit,
      total,
      hasMore: skip + rows.length < total,
    };
  }
}
