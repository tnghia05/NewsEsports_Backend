import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model, PipelineStage } from 'mongoose';
import { PostModelName, type PostDocument } from '../models/post.model';

@Injectable()
export class HashtagsService {
  constructor(
    @InjectModel(PostModelName)
    private readonly postModel: Model<PostDocument>,
  ) {}

  async listPostsByTag(tag: string, opts: { tab: 'latest' | 'hot'; page: number; limit: number }) {
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
    const sinceMs = window === '7d' ? 7 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
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
}

function normalizeTag(tag: string) {
  return tag.trim().toLowerCase().replace(/^#/, '');
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

