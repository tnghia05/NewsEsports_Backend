import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { CommentModelName, type CommentDocument } from '../models/comment.model';
import { PostModelName, type PostDocument } from '../models/post.model';
import {
  AdminAlertModelName,
  type AdminAlertDocument,
} from '../models/admin-alert.model';

@Injectable()
export class AiStatsService {
  constructor(
    @InjectModel(CommentModelName)
    private readonly commentModel: Model<CommentDocument>,
    @InjectModel(PostModelName)
    private readonly postModel: Model<PostDocument>,
    @InjectModel(AdminAlertModelName)
    private readonly alertModel: Model<AdminAlertDocument>,
  ) {}

  // #11 Per-day comment moderation breakdown (last N days)
  async getModerationStats(days = 7) {
    const since = new Date(Date.now() - days * 24 * 60 * 60_000);
    const rows = await this.commentModel
      .aggregate([
        { $match: { createdAt: { $gte: since } } },
        {
          $group: {
            _id: {
              date: {
                $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
              },
              status: '$moderationStatus',
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { '_id.date': 1 } },
      ])
      .exec();

    // Pivot into { date -> { approved, rejected, pending, under_review } }
    const byDate: Record<string, Record<string, number>> = {};
    for (const r of rows) {
      const date: string = r._id.date;
      const status: string = r._id.status ?? 'unknown';
      if (!byDate[date]) byDate[date] = {};
      byDate[date][status] = Number(r.count);
    }

    return Object.entries(byDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, counts]) => ({ date, ...counts }));
  }

  // #11 Global sentiment4 distribution across all labeled comments
  async getSentiment4Distribution() {
    const rows = await this.commentModel
      .aggregate([
        { $match: { sentiment4: { $exists: true, $ne: null } } },
        { $group: { _id: '$sentiment4', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ])
      .exec();

    const total = rows.reduce((s: number, r: any) => s + Number(r.count), 0);
    return rows.map((r: any) => ({
      label: r._id,
      count: Number(r.count),
      ratio: total > 0 ? Math.round((Number(r.count) / total) * 10000) / 10000 : 0,
    }));
  }

  // #11 Toxic rate per game (join Comment -> Post via postId)
  async getToxicRateByGame() {
    const rows = await this.commentModel
      .aggregate([
        {
          $match: {
            'toxicity.isToxic': { $exists: true },
            postId: { $exists: true, $ne: null },
          },
        },
        {
          $lookup: {
            from: 'posts',
            let: { pid: '$postId' },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ['$_id', { $toObjectId: '$$pid' }] },
                },
              },
              { $project: { game: 1 } },
            ],
            as: 'post',
          },
        },
        { $unwind: { path: '$post', preserveNullAndEmptyArrays: false } },
        {
          $group: {
            _id: '$post.game',
            total: { $sum: 1 },
            toxic: {
              $sum: { $cond: ['$toxicity.isToxic', 1, 0] },
            },
          },
        },
        {
          $addFields: {
            toxicRate: {
              $round: [{ $divide: ['$toxic', '$total'] }, 4],
            },
          },
        },
        { $sort: { toxicRate: -1 } },
      ])
      .exec();

    return rows.map((r: any) => ({
      game: r._id ?? 'unknown',
      total: Number(r.total),
      toxic: Number(r.toxic),
      toxicRate: Number(r.toxicRate),
    }));
  }

  // #9 Recent toxicity spike alerts
  async getRecentAlerts(opts: { limit: number; unreadOnly: boolean }) {
    const limit = Math.min(100, Math.max(1, opts.limit));
    const filter = opts.unreadOnly ? { isRead: false } : {};
    const items = await this.alertModel
      .find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean()
      .exec();

    return items.map((a: any) => ({
      id: String(a._id),
      type: a.type,
      tag: a.tag,
      ratio3h: a.ratio3h,
      ratio24h: a.ratio24h,
      isRead: a.isRead,
      createdAt: a.createdAt,
    }));
  }

  async markAlertRead(alertId: string) {
    await this.alertModel
      .updateOne({ _id: alertId }, { $set: { isRead: true } })
      .exec();
    return { ok: true };
  }

  // #13 List comments pending manual review (under_review status)
  async getUnderReviewComments(opts: { page: number; limit: number }) {
    const page = Math.max(1, opts.page);
    const limit = Math.min(50, Math.max(1, opts.limit));
    const skip = (page - 1) * limit;
    const filter = { moderationStatus: 'under_review', isDeleted: { $ne: true } };

    const [items, total] = await Promise.all([
      this.commentModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.commentModel.countDocuments(filter).exec(),
    ]);

    return {
      items: items.map((c: any) => ({
        id: String(c._id),
        postId: c.postId,
        newsId: c.newsId,
        authorId: c.authorId,
        content: c.content,
        confidence: c.sentiment4Scores
          ? Math.max(...Object.values(c.sentiment4Scores as Record<string, number>))
          : undefined,
        sentiment4: c.sentiment4,
        intent: c.intent,
        toxicityScore: c.toxicity?.score,
        createdAt: c.createdAt,
      })),
      page,
      limit,
      total,
      hasMore: skip + items.length < total,
    };
  }

  // #13 Admin manually approves or rejects an under_review comment
  async reviewComment(commentId: string, decision: 'approved' | 'rejected') {
    const result = await this.commentModel
      .updateOne(
        { _id: commentId, moderationStatus: 'under_review' },
        { $set: { moderationStatus: decision } },
      )
      .exec();
    return { ok: (result as any).modifiedCount > 0 };
  }
}
