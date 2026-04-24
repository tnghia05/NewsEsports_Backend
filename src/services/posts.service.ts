import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model, PipelineStage, QueryFilter } from 'mongoose';
import { PostModelName, type PostDocument } from '../models/post.model';
import type { JwtUser } from '../types/auth';
import type { CreatePostDto } from '../dto/posts/create-post.dto';
import type { UpdatePostDto } from '../dto/posts/update-post.dto';
import type { QueryPostsDto } from '../dto/posts/query-posts.dto';
import { FollowsService } from './follows.service';

@Injectable()
export class PostsService {
  constructor(
    @InjectModel(PostModelName) private readonly postModel: Model<PostDocument>,
    private readonly followsService: FollowsService,
  ) {}

  async create(author: JwtUser, dto: CreatePostDto) {
    const tags = normalizeTags(dto.tags);
    return this.postModel.create({
      authorId: author.id,
      title: dto.title.trim(),
      content: dto.content,
      thumbnailUrl: dto.thumbnailUrl?.trim(),
      game: dto.game.trim().toLowerCase(),
      tournament: dto.tournament?.trim(),
      tags,
      status: dto.status,
      viewCount: 0,
      commentCount: 0,
      likeCount: 0,
      isPinned: false,
    });
  }

  async update(author: JwtUser, postId: string, dto: UpdatePostDto) {
    const post = await this.requirePost(postId);
    assertCanEditPost(author, post);

    const patch: Partial<PostDocument> = {};
    if (dto.title !== undefined) patch.title = dto.title.trim();
    if (dto.content !== undefined) patch.content = dto.content;
    if (dto.thumbnailUrl !== undefined)
      patch.thumbnailUrl = dto.thumbnailUrl?.trim();
    if (dto.game !== undefined) patch.game = dto.game.trim().toLowerCase();
    if (dto.tournament !== undefined)
      patch.tournament = dto.tournament?.trim();
    if (dto.tags !== undefined) patch.tags = normalizeTags(dto.tags);
    if (dto.status !== undefined) patch.status = dto.status;

    const updated = await this.postModel
      .findByIdAndUpdate(post._id, { $set: patch }, { new: true })
      .exec();
    if (!updated) throw new NotFoundException('Post not found');
    return updated;
  }

  async remove(author: JwtUser, postId: string) {
    const post = await this.requirePost(postId);
    assertCanEditPost(author, post);
    await post.deleteOne();
    return { ok: true };
  }

  async getById(author: JwtUser | undefined, postId: string) {
    const post = await this.requirePost(postId);
    assertCanReadPost(author, post);

    await this.postModel.updateOne({ _id: post._id }, { $inc: { viewCount: 1 } }).exec();
    const refreshed = await this.postModel.findById(post._id).exec();
    if (!refreshed) throw new NotFoundException('Post not found');
    return refreshed;
  }

  async list(author: JwtUser | undefined, query: QueryPostsDto) {
    const page = query.page;
    const limit = query.limit;
    const skip = (page - 1) * limit;

    if (query.tab === 'following') {
      if (!author) throw new ForbiddenException('Login required for following feed');
      const followeeIds = await this.followsService.listFolloweeIds(author.id);
      if (followeeIds.length === 0) {
        return { items: [], page, limit };
      }

      const filter: QueryFilter<PostDocument> = {
        status: 'published',
        authorId: { $in: followeeIds },
      };
      applyGameTagFilters(filter, query);

      const items = await this.postModel
        .find(filter)
        .sort({ isPinned: -1, pinnedAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec();

      return { items, page, limit };
    }

    const baseFilter: QueryFilter<PostDocument> = {};
    applyVisibility(baseFilter, author);
    applyGameTagFilters(baseFilter, query);

    if (query.tab === 'hot') {
      const pipeline: PipelineStage[] = [
        { $match: baseFilter },
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
        { $sort: { isPinned: -1, pinnedAt: -1, hotScore: -1, createdAt: -1 } },
        { $skip: skip },
        { $limit: limit },
      ];

      const items = await this.postModel.aggregate(pipeline).exec();
      return { items, page, limit };
    }

    // latest
    const items = await this.postModel
      .find(baseFilter)
      .sort({ isPinned: -1, pinnedAt: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();

    return { items, page, limit };
  }

  private async requirePost(postId: string) {
    const post = await this.postModel.findById(postId).exec();
    if (!post) throw new NotFoundException('Post not found');
    return post;
  }
}

function applyVisibility(
  filter: QueryFilter<PostDocument>,
  viewer: JwtUser | undefined,
) {
  if (!viewer) {
    filter['status'] = 'published';
    return;
  }

  filter['$or'] = [
    { status: 'published' },
    { status: 'draft', authorId: viewer.id },
    ...(viewer.role === 'admin' ? [{ status: 'draft' }] : []),
  ];
}

function assertCanReadPost(viewer: JwtUser | undefined, post: PostDocument) {
  if (post.status === 'published') return;
  if (!viewer) throw new ForbiddenException('Forbidden');
  if (viewer.role === 'admin') return;
  if (post.authorId === viewer.id) return;
  throw new ForbiddenException('Forbidden');
}

function assertCanEditPost(viewer: JwtUser, post: PostDocument) {
  if (viewer.role === 'admin') return;
  if (post.authorId === viewer.id) return;
  throw new ForbiddenException('Forbidden');
}

function normalizeTags(tags?: string[]) {
  if (!tags) return [];
  const out = new Set<string>();
  for (const t of tags) {
    const s = t.trim().toLowerCase();
    if (!s) continue;
    out.add(s.startsWith('#') ? s.slice(1) : s);
  }
  return [...out];
}

function applyGameTagFilters(
  filter: QueryFilter<PostDocument>,
  query: QueryPostsDto,
) {
  const game = query.game?.trim().toLowerCase();
  const tag = query.tag?.trim().toLowerCase().replace(/^#/, '');

  if (!game && !tag) return;

  // If we already have a top-level `$or` (visibility rules), compose with `$and`
  // so Mongo treats it as (visibility) AND (game/tag), not conflicting keys.
  const extra: QueryFilter<PostDocument> = {};
  if (game) extra['game'] = game;
  if (tag) extra['tags'] = { $in: [tag] };

  const existingOr = filter['$or'];
  if (existingOr) {
    filter['$and'] = [...(filter['$and'] ?? []), { $or: existingOr }, extra];
    delete filter['$or'];
    return;
  }

  if (game) filter['game'] = game;
  if (tag) filter['tags'] = { $in: [tag] };
}

function recencyBoostExpr() {
  const now = Date.now();
  const windowMs = 48 * 60 * 60 * 1000;
  return {
    $let: {
      vars: {
        ageMs: {
          $subtract: [
            now,
            { $toLong: { $toDate: '$createdAt' } },
          ],
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
                    $subtract: [
                      1,
                      { $divide: ['$$ageMs', windowMs] },
                    ],
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
