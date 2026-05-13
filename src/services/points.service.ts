import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { UserModelName, type UserDocument } from '../models/user.model';
import {
  PointLedgerModelName,
  type PointLedgerDocument,
  type PointReason,
} from '../models/point-ledger.model';

export const POINT_REWARDS: Record<PointReason, number> = {
  checkin: 10,
  post_publish: 20,
  comment_create: 5,
  prediction_win: 0, // dynamic
  prediction_bet: 0, // dynamic (negative)
  redeem_product: 0, // dynamic (negative)
  checkout_discount: 0, // dynamic (negative)
  admin_adjust: 0, // dynamic
};

@Injectable()
export class PointsService {
  constructor(
    @InjectModel(UserModelName)
    private readonly userModel: Model<UserDocument>,
    @InjectModel(PointLedgerModelName)
    private readonly ledgerModel: Model<PointLedgerDocument>,
  ) {}

  async getBalance(userId: string): Promise<number> {
    const user = await this.userModel
      .findById(userId)
      .select('points')
      .lean()
      .exec();
    if (!user) throw new NotFoundException('User not found');
    return (user as any).points ?? 0;
  }

  async getHistory(userId: string, limit = 20, skip = 0) {
    const [items, total] = await Promise.all([
      this.ledgerModel
        .find({ userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.ledgerModel.countDocuments({ userId }),
    ]);
    return { items, total };
  }

  async addPoints(
    userId: string,
    delta: number,
    reason: PointReason,
    meta?: Record<string, unknown>,
  ): Promise<number> {
    const user = await this.userModel
      .findByIdAndUpdate(
        userId,
        { $inc: { points: delta } },
        { new: true, select: 'points' },
      )
      .lean()
      .exec();
    if (!user) throw new NotFoundException('User not found');
    const balanceAfter = (user as any).points ?? 0;
    await this.ledgerModel.create({ userId, delta, balanceAfter, reason, meta });
    return balanceAfter;
  }

  async deductPoints(
    userId: string,
    amount: number,
    reason: PointReason,
    meta?: Record<string, unknown>,
  ): Promise<number> {
    if (amount <= 0) throw new BadRequestException('Amount must be positive');
    const current = await this.getBalance(userId);
    if (current < amount)
      throw new BadRequestException(
        `Không đủ điểm (cần ${amount}, hiện có ${current})`,
      );
    return this.addPoints(userId, -amount, reason, meta);
  }

  async checkin(userId: string): Promise<{ points: number; alreadyDone: boolean }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const existing = await this.ledgerModel
      .findOne({
        userId,
        reason: 'checkin',
        createdAt: { $gte: today, $lt: tomorrow },
      })
      .lean()
      .exec();

    if (existing) {
      const balance = await this.getBalance(userId);
      return { points: balance, alreadyDone: true };
    }

    const balance = await this.addPoints(userId, POINT_REWARDS.checkin, 'checkin');
    return { points: balance, alreadyDone: false };
  }
}
