import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model, PipelineStage, QueryFilter } from 'mongoose';
import { PostModelName, type PostDocument } from '../models/post.model';
import { PostLikeModelName, type PostLikeDocument } from '../models/post-like.model';
import { PostSaveModelName, type PostSaveDocument } from '../models/post-save.model';
import type { JwtUser } from '../types/auth';
import type { CreatePostDto } from '../dto/posts/create-post.dto';
import type { UpdatePostDto } from '../dto/posts/update-post.dto';
import type { QueryPostsDto } from '../dto/posts/query-posts.dto';
import type { QueryUserPostsDto } from '../dto/users/query-user-posts.dto';
import { FollowsService } from './follows.service';

@Injectable()
export class PostsService {
  constructor(
    @InjectModel(PostModelName) private readonly postModel: Model<PostDocument>,
    @InjectModel(PostLikeModelName) private readonly postLikeModel: Model<PostLikeDocument>,
    @InjectModel(PostSaveModelName) private readonly postSaveModel: Model<PostSaveDocument>,
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
    if (!author) return refreshed;

    const [liked, saved] = await Promise.all([
      this.postLikeModel.exists({ postId: String(refreshed._id), userId: author.id }),
      this.postSaveModel.exists({ postId: String(refreshed._id), userId: author.id }),
    ]);
    return Object.assign(refreshed.toObject(), {
      likedByMe: Boolean(liked),
      savedByMe: Boolean(saved),
    });
  }

  async list(author: JwtUser | undefined, query: QueryPostsDto) {
    const page = query.page;
    const limit = query.limit;
    const skip = (page - 1) * limit;

    if (query.tab === 'saved') {
      if (!author) throw new ForbiddenException('Login required for saved feed');

      const saves = await this.postSaveModel
        .find({ userId: author.id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec();

      const total = await this.postSaveModel.countDocuments({ userId: author.id }).exec();

      const postIds = saves.map((s) => s.postId);
      if (postIds.length === 0) {
        return { items: [], page, limit, total, hasMore: false };
      }

      const baseFilter: QueryFilter<PostDocument> = { _id: { $in: postIds } };
      applyVisibility(baseFilter, author);
      applyGameTagFilters(baseFilter, query);

      const posts = await this.postModel.find(baseFilter).exec();
      const byId = new Map(posts.map((p) => [String(p._id), p]));
      const items = postIds.map((id) => byId.get(String(id))).filter(Boolean) as PostDocument[];

      const likedIds = new Set(
        (
          await this.postLikeModel
            .find({ userId: author.id, postId: { $in: postIds } })
            .select({ postId: 1 })
            .lean()
            .exec()
        ).map((r) => r.postId),
      );

      const out = items.map((p) => ({
        ...p.toObject(),
        likedByMe: likedIds.has(String(p._id)),
        savedByMe: true,
      }));

      return { items: out, page, limit, total, hasMore: skip + out.length < total };
    }

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

      return attachLikeSaveFlags(this.postLikeModel, this.postSaveModel, author, items, page, limit);
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

      const rawItems = await this.postModel.aggregate(pipeline).exec();
      return attachLikeSaveFlags(this.postLikeModel, this.postSaveModel, author, rawItems, page, limit);
    }

    // latest
    const items = await this.postModel
      .find(baseFilter)
      .sort({ isPinned: -1, pinnedAt: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();

    return attachLikeSaveFlags(this.postLikeModel, this.postSaveModel, author, items, page, limit);
  }

  async listByUser(
    viewer: JwtUser | undefined,
    userId: string,
    query: QueryUserPostsDto,
  ) {
    const page = query.page;
    const limit = query.limit;
    const skip = (page - 1) * limit;

    const filter: QueryFilter<PostDocument> = { authorId: userId };

    // Visibility + status selection
    if (!viewer) {
      filter.status = 'published';
    } else if (viewer.role === 'admin') {
      if (query.status && query.status !== 'all') filter.status = query.status;
    } else if (viewer.id === userId) {
      if (query.status && query.status !== 'all') filter.status = query.status;
    } else {
      filter.status = 'published';
    }

    const game = query.game?.trim().toLowerCase();
    const tag = query.tag?.trim().toLowerCase().replace(/^#/, '');
    if (game) filter.game = game;
    if (tag) filter.tags = { $in: [tag] };

    const items = await this.postModel
      .find(filter)
      .sort({ isPinned: -1, pinnedAt: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();

    const total = await this.postModel.countDocuments(filter).exec();
    const withFlags = await attachLikeSaveFlags(
      this.postLikeModel,
      this.postSaveModel,
      viewer,
      items,
      page,
      limit,
    );

    return {
      ...withFlags,
      total,
      hasMore: skip + (withFlags.items?.length ?? 0) < total,
    };
  }

  async listLikes(postId: string, opts: { page: number; limit: number }) {
    const post = await this.requirePost(postId);
    // public published post ok; drafts: only author/admin will likely use this; keep it strict:
    // if someone wants it public later, relax here.
    if (post.status !== 'published') {
      throw new ForbiddenException('Forbidden');
    }

    const page = Math.max(1, Number(opts.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(opts.limit) || 20));
    const skip = (page - 1) * limit;

    const filter = { postId: String(post._id) };
    const total = await this.postLikeModel.countDocuments(filter).exec();
    const rows = await this.postLikeModel
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()
      .exec();

    return {
      items: rows.map((r: any) => ({ userId: r.userId, createdAt: r.createdAt })),
      page,
      limit,
      total,
      hasMore: skip + rows.length < total,
    };
  }

  async pin(postId: string) {
    const updated = await this.postModel
      .findByIdAndUpdate(
        postId,
        { $set: { isPinned: true, pinnedAt: new Date() } },
        { new: true },
      )
      .exec();
    if (!updated) throw new NotFoundException('Post not found');
    return updated;
  }

  async unpin(postId: string) {
    const updated = await this.postModel
      .findByIdAndUpdate(
        postId,
        { $set: { isPinned: false }, $unset: { pinnedAt: 1 } },
        { new: true },
      )
      .exec();
    if (!updated) throw new NotFoundException('Post not found');
    return updated;
  }

  private async requirePost(postId: string) {
    const post = await this.postModel.findById(postId).exec();
    if (!post) throw new NotFoundException('Post not found');
    return post;
  }
}

async function attachLikeSaveFlags(
  postLikeModel: Model<PostLikeDocument>,
  postSaveModel: Model<PostSaveDocument>,
  viewer: JwtUser | undefined,
  items: any[],
  page: number,
  limit: number,
) {
  if (!viewer) return { items, page, limit };
  const ids = items.map((p) => String(p._id));
  if (ids.length === 0) return { items, page, limit };

  const [likes, saves] = await Promise.all([
    postLikeModel
      .find({ userId: viewer.id, postId: { $in: ids } })
      .select({ postId: 1 })
      .lean()
      .exec(),
    postSaveModel
      .find({ userId: viewer.id, postId: { $in: ids } })
      .select({ postId: 1 })
      .lean()
      .exec(),
  ]);

  const liked = new Set(likes.map((r) => r.postId));
  const saved = new Set(saves.map((r) => r.postId));

  const out = items.map((p) => ({
    ...(typeof p.toObject === 'function' ? p.toObject() : p),
    likedByMe: liked.has(String(p._id)),
    savedByMe: saved.has(String(p._id)),
  }));

  return { items: out, page, limit };
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
