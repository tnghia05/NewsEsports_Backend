import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import {
  NotificationModelName,
  type NotificationDocument,
  type NotificationType,
} from '../models/notification.model';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(NotificationModelName)
    private readonly notificationModel: Model<NotificationDocument>,
  ) {}

  async create(input: {
    userId: string;
    actorId?: string;
    type: NotificationType;
    postId?: string;
    commentId?: string;
    message?: string;
  }) {
    // Prevent self-notifications (except system notifications)
    if (
      input.actorId &&
      input.actorId === input.userId &&
      input.type !== 'toxic_warning' &&
      input.type !== 'account_ban'
    )
      return { ok: true };
    await this.notificationModel.create({
      ...input,
      isRead: false,
    });
    return { ok: true };
  }

  async list(userId: string, opts: { page: number; limit: number }) {
    const page = Math.max(1, Number(opts.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(opts.limit) || 20));
    const skip = (page - 1) * limit;

    const filter = { userId };
    const [total, items] = await Promise.all([
      this.notificationModel.countDocuments(filter).exec(),
      this.notificationModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
    ]);

    return { items, page, limit, total, hasMore: skip + items.length < total };
  }

  async markRead(userId: string, notificationId: string) {
    const notif = await this.notificationModel.findById(notificationId).exec();
    if (!notif) throw new NotFoundException('Notification not found');
    if (notif.userId !== userId) throw new ForbiddenException('Forbidden');

    if (notif.isRead) return { ok: true };
    await this.notificationModel
      .updateOne(
        { _id: notif._id },
        { $set: { isRead: true, readAt: new Date() } },
      )
      .exec();
    return { ok: true };
  }

  async markAllRead(userId: string) {
    await this.notificationModel
      .updateMany(
        { userId, isRead: false },
        { $set: { isRead: true, readAt: new Date() } },
      )
      .exec();
    return { ok: true };
  }
}
