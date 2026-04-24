import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { FollowModelName, type FollowDocument } from '../models/follow.model';

@Injectable()
export class FollowsService {
  constructor(
    @InjectModel(FollowModelName)
    private readonly followModel: Model<FollowDocument>,
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
    return { following: true };
  }
}
