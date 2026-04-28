import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model, PipelineStage } from 'mongoose';
import { PostModelName, type PostDocument } from '../models/post.model';
import {
  CommentModelName,
  type CommentDocument,
} from '../models/comment.model';
import {
  HashtagEventModelName,
  type HashtagEventDocument,
} from '../models/hashtag-event.model';
import {
  HotTopicModelName,
  type HotTopicDocument,
  type HotTopicWindow,
} from '../models/hot-topic.model';
import type { JwtUser } from '../types/auth';
import type { CreateHashtagEventDto } from '../dto/hashtags/create-hashtag-event.dto';
import type { HotTopicsDto } from '../dto/hashtags/hot-topics.dto';

@Injectable()
export class HashtagsService {
  constructor(
    @InjectModel(PostModelName)
    private readonly postModel: Model<PostDocument>,
    @InjectModel(CommentModelName)
    private readonly commentModel: Model<CommentDocument>,
    @InjectModel(HashtagEventModelName)
    private readonly hashtagEventModel: Model<HashtagEventDocument>,
    @InjectModel(HotTopicModelName)
    private readonly hotTopicModel: Model<HotTopicDocument>,
  ) {}

  async listPostsByTag(
    tag: string,
    opts: { tab: 'latest' | 'hot'; page: number; limit: number },
  ) {
    const page = opts.page;
    const limit = opts.limit;
    const skip = (page - 1) * limit;
    const normalized = normalizeTag(tag);

    const baseMatch: any = { status: 'published', tags: { $in: [normalized] } };

    if (opts.tab === 'hot') {
      const pipeline: PipelineStage[] = [
        { $match: baseMatch },
        {
          $addFields: {
            hotScore: {
              $add: [
                { $multiply: ['$likeCount', 3] },
                { $multiply: ['$commentCount', 5] },
                { $multiply: ['$viewCount', 1] },
                recencyBoostExpr(),
              ],
            },
          },
        },
        { $sort: { hotScore: -1, createdAt: -1 } },
        { $skip: skip },
        { $limit: limit },
      ];
      const items = await this.postModel.aggregate(pipeline).exec();
      return { items, page, limit };
    }

    const items = await this.postModel
      .find(baseMatch)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();

    return { items, page, limit };
  }

  async trending(window: '24h' | '7d') {
    const sinceMs =
      window === '7d' ? 7 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
    const since = new Date(Date.now() - sinceMs);

    const pipeline: PipelineStage[] = [
      { $match: { status: 'published', createdAt: { $gte: since } } },
      { $unwind: '$tags' },
      {
        $addFields: {
          engagement: {
            $add: [
              { $multiply: ['$likeCount', 3] },
              { $multiply: ['$commentCount', 5] },
              { $multiply: ['$viewCount', 1] },
            ],
          },
        },
      },
      {
        $group: {
          _id: '$tags',
          postCount: { $sum: 1 },
          engagement: { $sum: '$engagement' },
        },
      },
      {
        $addFields: {
          score: { $add: ['$postCount', '$engagement'] },
        },
      },
      { $sort: { score: -1 } },
      { $limit: 30 },
      {
        $project: {
          _id: 0,
          tag: '$_id',
          postCount: 1,
          engagement: 1,
          score: 1,
        },
      },
    ];

    const items = await this.postModel.aggregate(pipeline).exec();
    return { window, items };
  }

  async createEvent(user: JwtUser | undefined, dto: CreateHashtagEventDto) {
    const tag = normalizeTag(dto.tag);
    if (!tag) return { ok: true };
    await this.hashtagEventModel.create({
      userId: user?.id,
      sessionId: dto.sessionId?.trim(),
      tag,
      action: 'view',
    });
    return { ok: true };
  }

  async hotTopics(query: HotTopicsDto) {
    const window = normalizeHotTopicWindow(query.window);
    const limit = Math.min(50, Math.max(1, Number(query.limit) || 10));
    const items = await this.hotTopicModel
      .find({ window })
      .sort({ hotness: -1 })
      .limit(limit)
      .lean()
      .exec();

    const updatedAt =
      items.length > 0
        ? new Date(
            Math.max(
              ...items.map((r: any) =>
                r?.updatedAt instanceof Date
                  ? r.updatedAt.getTime()
                  : new Date(r?.updatedAt ?? 0).getTime(),
              ),
            ),
          ).toISOString()
        : undefined;

    return {
      window,
      updatedAt,
      items: items.map((r: any, idx: number) => ({
        rank: idx + 1,
        tag: r.tag,
        hotness: r.hotness,
        components: r.components,
        trend: r.trend ?? undefined,
      })),
    };
  }
}

function normalizeTag(tag: string) {
  return tag.trim().toLowerCase().replace(/^#/, '');
}

function normalizeHotTopicWindow(w: any): HotTopicWindow {
  if (w === '7d') return '7d';
  if (w === '24h') return '24h';
  return '3h';
}

function recencyBoostExpr() {
  const now = Date.now();
  const windowMs = 48 * 60 * 60 * 1000;
  return {
    $let: {
      vars: {
        ageMs: {
          $subtract: [now, { $toLong: { $toDate: '$createdAt' } }],
        },
      },
      in: {
        $cond: [
          { $lte: ['$$ageMs', windowMs] },
          {
            $multiply: [
              8,
              {
                $max: [
                  0,
                  {
                    $subtract: [1, { $divide: ['$$ageMs', windowMs] }],
                  },
                ],
              },
            ],
          },
          0,
        ],
      },
    },
  };
}
