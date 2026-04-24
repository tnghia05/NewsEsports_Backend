import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model, PipelineStage, QueryFilter } from 'mongoose';
import { PostModelName, type PostDocument } from '../models/post.model';
import { UserModelName, type UserDocument } from '../models/user.model';
import type { SearchPostsDto } from '../dto/search/search-posts.dto';
import type { SearchUsersDto } from '../dto/search/search-users.dto';

@Injectable()
export class SearchService {
  constructor(
    @InjectModel(PostModelName) private readonly postModel: Model<PostDocument>,
    @InjectModel(UserModelName) private readonly userModel: Model<UserDocument>,
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

