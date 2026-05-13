import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model, PipelineStage, QueryFilter } from 'mongoose';
import { PostModelName, type PostDocument } from '../models/post.model';
import { UserModelName, type UserDocument } from '../models/user.model';
import {
  PostLikeModelName,
  type PostLikeDocument,
} from '../models/post-like.model';
import {
  PostSaveModelName,
  type PostSaveDocument,
} from '../models/post-save.model';
import {
  CommentModelName,
  type CommentDocument,
} from '../models/comment.model';
import type { JwtUser } from '../types/auth';
import type { CreatePostDto } from '../dto/posts/create-post.dto';
import type { UpdatePostDto } from '../dto/posts/update-post.dto';
import type { QueryPostsDto } from '../dto/posts/query-posts.dto';
import type { QueryUserPostsDto } from '../dto/users/query-user-posts.dto';
import { FollowsService } from './follows.service';
import { PointsService } from './points.service';
import { assertCanReadPost } from '../utils/assert-can-read-post';

@Injectable()
export class PostsService {
  constructor(
    @InjectModel(PostModelName) private readonly postModel: Model<PostDocument>,
    @InjectModel(UserModelName) private readonly userModel: Model<UserDocument>,
    @InjectModel(PostLikeModelName)
    private readonly postLikeModel: Model<PostLikeDocument>,
    @InjectModel(PostSaveModelName)
    private readonly postSaveModel: Model<PostSaveDocument>,
    @InjectModel(CommentModelName)
    private readonly commentModel: Model<CommentDocument>,
    private readonly followsService: FollowsService,
    private readonly pointsService: PointsService,
  ) {}

  private async attachAuthors<T extends any>(items: T[]) {
    const authorIds = Array.from(
      new Set(items.map((p: any) => String(p.authorId ?? '')).filter(Boolean)),
    );
    if (authorIds.length === 0) return items;

    const users = await this.userModel
      .find({ _id: { $in: authorIds } })
      .select({ displayName: 1, avatarUrl: 1 })
      .lean()
      .exec();

    const byId = new Map(
      users.map((u: any) => [
        String(u._id),
        { id: String(u._id), displayName: u.displayName, avatarUrl: u.avatarUrl },
      ]),
    );

    return items.map((p: any) => ({
      ...(typeof p.toObject === 'function' ? p.toObject() : p),
      author: byId.get(String(p.authorId)) ?? { id: String(p.authorId) },
    }));
  }

  async create(author: JwtUser, dto: CreatePostDto) {
    const tags = normalizeTags(dto.tags);
    const post = await this.postModel.create({
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
    if (dto.status === 'published') {
      this.pointsService
        .addPoints(author.id, 20, 'post_publish', { postId: String(post._id) })
        .catch(() => {});
    }
    return post;
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
    if (dto.tournament !== undefined) patch.tournament = dto.tournament?.trim();
    if (dto.tags !== undefined) patch.tags = normalizeTags(dto.tags);
    if (dto.status !== undefined) patch.status = dto.status;

    const updated = await this.postModel
      .findByIdAndUpdate(post._id, { $set: patch }, { returnDocument: 'after' })
      .exec();
    if (!updated) throw new NotFoundException('Post not found');
    return updated;
  }

  async remove(author: JwtUser, postId: string) {
    const post = await this.requirePost(postId);
    assertCanEditPost(author, post);

    const pid = String(post._id);

    // Cascade cleanup: remove related data so nothing is orphaned.
    await Promise.all([
      this.commentModel.deleteMany({ postId: pid }).exec(),
      this.postLikeModel.deleteMany({ postId: pid }).exec(),
      this.postSaveModel.deleteMany({ postId: pid }).exec(),
    ]);

    await post.deleteOne();
    return { ok: true };
  }

  async getById(author: JwtUser | undefined, postId: string) {
    const post = await this.requirePost(postId);
    assertCanReadPost(author, post);

    // Skip viewCount increment for the post author (avoid self-inflate).
    const isAuthor = author && post.authorId === author.id;
    const refreshed = isAuthor
      ? post
      : ((await this.postModel
          .findByIdAndUpdate(
            post._id,
            { $inc: { viewCount: 1 } },
            { returnDocument: 'after' },
          )
          .exec()) ?? post);

    if (!author) {
      const [withAuthor] = await this.attachAuthors([refreshed as any]);
      return withAuthor;
    }

    const pid = String(refreshed._id);
    const [liked, saved] = await Promise.all([
      this.postLikeModel.exists({ postId: pid, userId: author.id }),
      this.postSaveModel.exists({ postId: pid, userId: author.id }),
    ]);
    const obj =
      typeof refreshed.toObject === 'function'
        ? refreshed.toObject()
        : refreshed;
    const [withAuthor] = await this.attachAuthors([obj as any]);
    return Object.assign(withAuthor, {
      likedByMe: Boolean(liked),
      savedByMe: Boolean(saved),
    });
  }

  async list(author: JwtUser | undefined, query: QueryPostsDto) {
    const page = query.page;
    const limit = query.limit;
    const skip = (page - 1) * limit;

    if (query.tab === 'saved') {
      if (!author)
        throw new ForbiddenException('Login required for saved feed');

      const saves = await this.postSaveModel
        .find({ userId: author.id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec();

      const total = await this.postSaveModel
        .countDocuments({ userId: author.id })
        .exec();

      const postIds = saves.map((s) => s.postId);
      if (postIds.length === 0) {
        return { items: [], page, limit, total, hasMore: false };
      }

      const baseFilter: QueryFilter<PostDocument> = { _id: { $in: postIds } };
      applyVisibility(baseFilter, author);
      applyGameTagFilters(baseFilter, query);

      const posts = await this.postModel.find(baseFilter).exec();
      const byId = new Map(posts.map((p) => [String(p._id), p]));
      const items = postIds
        .map((id) => byId.get(String(id)))
        .filter(Boolean) as PostDocument[];

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
      const outWithAuthors = await this.attachAuthors(out as any[]);

      return {
        items: outWithAuthors,
        page,
        limit,
        total,
        hasMore: skip + outWithAuthors.length < total,
      };
    }

    if (query.tab === 'following') {
      if (!author)
        throw new ForbiddenException('Login required for following feed');
      const followeeIds = await this.followsService.listFolloweeIds(author.id);
      if (followeeIds.length === 0) {
        return { items: [], page, limit, total: 0, hasMore: false };
      }

      const filter: QueryFilter<PostDocument> = {
        status: 'published',
        authorId: { $in: followeeIds },
      };
      applyGameTagFilters(filter, query);

      const [items, total] = await Promise.all([
        this.postModel
          .find(filter)
          .sort({ isPinned: -1, pinnedAt: -1, createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .exec(),
        this.postModel.countDocuments(filter).exec(),
      ]);

      const res = await attachLikeSaveFlags(
        this.postLikeModel,
        this.postSaveModel,
        author,
        items,
        page,
        limit,
        total,
        skip,
      );
      res.items = await this.attachAuthors(res.items as any[]);
      return res;
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

      const [rawItems, total] = await Promise.all([
        this.postModel.aggregate(pipeline).exec(),
        this.postModel.countDocuments(baseFilter).exec(),
      ]);
      const res = await attachLikeSaveFlags(
        this.postLikeModel,
        this.postSaveModel,
        author,
        rawItems,
        page,
        limit,
        total,
        skip,
      );
      res.items = await this.attachAuthors(res.items as any[]);
      return res;
    }

    // latest
    const [items, total] = await Promise.all([
      this.postModel
        .find(baseFilter)
        .sort({ isPinned: -1, pinnedAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.postModel.countDocuments(baseFilter).exec(),
    ]);

    const res = await attachLikeSaveFlags(
      this.postLikeModel,
      this.postSaveModel,
      author,
      items,
      page,
      limit,
      total,
      skip,
    );
    res.items = await this.attachAuthors(res.items as any[]);
    return res;
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

    const [items, total] = await Promise.all([
      this.postModel
        .find(filter)
        .sort({ isPinned: -1, pinnedAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.postModel.countDocuments(filter).exec(),
    ]);

    const res = await attachLikeSaveFlags(
      this.postLikeModel,
      this.postSaveModel,
      viewer,
      items,
      page,
      limit,
      total,
      skip,
    );
    res.items = await this.attachAuthors(res.items as any[]);
    return res;
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
      items: rows.map((r: any) => ({
        userId: r.userId,
        createdAt: r.createdAt,
      })),
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
        { returnDocument: 'after' },
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
        { returnDocument: 'after' },
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
  total?: number,
  skip?: number,
) {
  const hasMore =
    total != null && skip != null ? skip + items.length < total : undefined;
  if (!viewer)
    return { items, page, limit, ...(total != null ? { total, hasMore } : {}) };
  const ids = items.map((p) => String(p._id));
  if (ids.length === 0)
    return { items, page, limit, ...(total != null ? { total, hasMore } : {}) };

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

  return {
    items: out,
    page,
    limit,
    ...(total != null ? { total, hasMore } : {}),
  };
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
    ...(viewer.role === 'admin'
      ? ([{ status: 'draft' as const }] as const)
      : []),
  ];
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
