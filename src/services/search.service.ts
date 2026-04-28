import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model, PipelineStage, QueryFilter } from 'mongoose';
import { PostModelName, type PostDocument } from '../models/post.model';
import { UserModelName, type UserDocument } from '../models/user.model';
import type { SearchPostsDto } from '../dto/search/search-posts.dto';
import type { SearchUsersDto } from '../dto/search/search-users.dto';
import type { JwtUser } from '../types/auth';
import type { CreateSearchEventDto } from '../dto/search/create-search-event.dto';
import {
  SearchEventModelName,
  type SearchEventDocument,
} from '../models/search-event.model';
import {
  HotKeywordModelName,
  type HotKeywordDocument,
  type HotKeywordWindow,
} from '../models/hot-keyword.model';

@Injectable()
export class SearchService {
  constructor(
    @InjectModel(PostModelName) private readonly postModel: Model<PostDocument>,
    @InjectModel(UserModelName) private readonly userModel: Model<UserDocument>,
    @InjectModel(SearchEventModelName)
    private readonly searchEventModel: Model<SearchEventDocument>,
    @InjectModel(HotKeywordModelName)
    private readonly hotKeywordModel: Model<HotKeywordDocument>,
  ) {}

  async searchPosts(query: SearchPostsDto) {
    const page = query.page;
    const limit = query.limit;
    const skip = (page - 1) * limit;

    const filter: QueryFilter<PostDocument> = { status: 'published' };

    const game = query.game?.trim().toLowerCase();
    const tag = query.tag?.trim().toLowerCase().replace(/^#/, '');
    if (game) filter.game = game;
    if (tag) filter.tags = { $in: [tag] };

    const q = query.q?.trim();
    if (q) {
      filter.$text = { $search: q };
    }

    if (query.tab === 'hot') {
      const pipeline: PipelineStage[] = [
        { $match: filter },
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
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();

    return { items, page, limit };
  }

  async searchUsers(query: SearchUsersDto) {
    const page = query.page;
    const limit = query.limit;
    const skip = (page - 1) * limit;

    const q = query.q.trim();
    const filter: any = { $text: { $search: q } };
    const items = await this.userModel
      .find(filter)
      .select({ displayName: 1, avatarUrl: 1 })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()
      .exec();

    return {
      items: items.map((u: any) => ({
        id: String(u._id),
        displayName: u.displayName,
        avatarUrl: u.avatarUrl ?? undefined,
      })),
      page,
      limit,
    };
  }

  async createEvent(user: JwtUser | undefined, dto: CreateSearchEventDto) {
    const q = normalizeKeyword(dto.q);
    if (!q) return { ok: true };
    await this.searchEventModel.create({
      userId: user?.id,
      sessionId: dto.sessionId?.trim(),
      q,
      action: dto.action,
      targetType: dto.targetType,
      targetId: dto.targetId?.trim(),
    });
    return { ok: true };
  }

  async getHotKeywords(opts: { window: HotKeywordWindow; limit: number }) {
    const window = normalizeWindow(opts.window);
    const limit = Math.min(50, Math.max(1, Number(opts.limit) || 10));
    const items = await this.hotKeywordModel
      .find({ window })
      .sort({ score: -1 })
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
        keyword: r.keyword,
        score: r.score,
      })),
    };
  }

  async getTrends(opts: { window: HotKeywordWindow; limit: number }) {
    const window = normalizeWindow(opts.window);
    const limit = Math.min(50, Math.max(1, Number(opts.limit) || 10));
    const items = await this.hotKeywordModel
      .find({ window })
      .sort({ score: -1 })
      .limit(limit)
      .lean()
      .exec();
    return {
      window,
      items: items.map((r: any) => ({
        keyword: r.keyword,
        score: r.score,
        trend: r.trend ?? undefined,
      })),
    };
  }

  async suggest(opts: { q: string; limit: number }) {
    const limit = Math.min(20, Math.max(1, Number(opts.limit) || 10));
    const q = normalizeKeyword(opts.q);
    if (!q) {
      const hot = await this.hotKeywordModel
        .find({ window: '24h' })
        .sort({ score: -1 })
        .limit(limit)
        .lean()
        .exec();
      return { items: hot.map((r: any) => r.keyword) };
    }

    const rx = new RegExp(`^${escapeRegex(q)}`, 'i');
    const [hotMatches, recentMatches] = await Promise.all([
      this.hotKeywordModel
        .find({ window: '24h', keyword: { $regex: rx } })
        .sort({ score: -1 })
        .limit(limit)
        .lean()
        .exec(),
      this.searchEventModel
        .aggregate([
          { $match: { q: { $regex: rx } } },
          { $group: { _id: '$q', lastAt: { $max: '$createdAt' } } },
          { $sort: { lastAt: -1 } },
          { $limit: limit },
        ])
        .exec(),
    ]);

    const out: string[] = [];
    const seen = new Set<string>();
    for (const r of hotMatches) {
      const k = String((r as any).keyword);
      if (!seen.has(k)) {
        seen.add(k);
        out.push(k);
      }
    }
    for (const r of recentMatches) {
      const k = String(r._id);
      if (!seen.has(k)) {
        seen.add(k);
        out.push(k);
      }
    }

    return { items: out.slice(0, limit) };
  }
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

function normalizeKeyword(input: string) {
  return input.trim().toLowerCase().replace(/\s+/g, ' ').slice(0, 200);
}

function normalizeWindow(w: any): HotKeywordWindow {
  return w === '7d' ? '7d' : '24h';
}

function escapeRegex(input: string) {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
