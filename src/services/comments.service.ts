import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model, QueryFilter } from 'mongoose';
import {
  CommentModelName,
  type CommentDocument,
} from '../models/comment.model';
import { PostModelName, type PostDocument } from '../models/post.model';
import {
  NewsModelName,
  type NewsDocument,
} from '../models/news.model';
import type { JwtUser } from '../types/auth';
import type { QueryCommentsDto } from '../dto/comments/query-comments.dto';
import type { CreateCommentDto } from '../dto/comments/create-comment.dto';
import type { UpdateCommentDto } from '../dto/comments/update-comment.dto';
import { NotificationsService } from './notifications.service';
import { PointsService } from './points.service';
import { UsersService } from './users.service';
import {
  CommentModerationJobModelName,
  type CommentModerationJobDocument,
} from '../models/comment-moderation-job.model';
import { assertCanReadPost } from '../utils/assert-can-read-post';

@Injectable()
export class CommentsService {
  private readonly logger = new Logger(CommentsService.name);

  constructor(
    @InjectModel(CommentModelName)
    private readonly commentModel: Model<CommentDocument>,
    @InjectModel(PostModelName)
    private readonly postModel: Model<PostDocument>,
    @InjectModel(NewsModelName)
    private readonly newsModel: Model<NewsDocument>,
    private readonly notificationsService: NotificationsService,
    @InjectModel(CommentModerationJobModelName)
    private readonly jobModel: Model<CommentModerationJobDocument>,
    private readonly pointsService: PointsService,
    private readonly usersService: UsersService,
  ) {}

  async listForPost(
    viewer: JwtUser | undefined,
    postId: string,
    query: QueryCommentsDto,
  ) {
    const post = await this.requirePost(postId);
    assertCanReadPost(viewer, post);

    const page = query.page;
    const limit = query.limit;
    const skip = (page - 1) * limit;

    const filter: QueryFilter<CommentDocument> = {
      postId,
      isDeleted: { $ne: true },
    };
    if (query.parentId) {
      filter.parentId = query.parentId;
    } else if (query.topLevelOnly) {
      filter.parentId = { $exists: false };
    }

    this.applyModerationFilter(filter, viewer, {
      ownerId: post.authorId,
    });

    const sort =
      query.sort === 'newest'
        ? ({ createdAt: -1 as const } as const)
        : ({ createdAt: 1 as const } as const);

    const items = await this.commentModel
      .find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .exec();

    const total = await this.commentModel.countDocuments(filter).exec();
    const hasMore = skip + items.length < total;

    return { items, page, limit, total, hasMore };
  }

  async listForNews(
    viewer: JwtUser | undefined,
    newsId: string,
    query: QueryCommentsDto,
  ) {
    const news = await this.requirePublishedNews(newsId);

    const page = query.page;
    const limit = query.limit;
    const skip = (page - 1) * limit;

    const filter: QueryFilter<CommentDocument> = {
      newsId,
      isDeleted: { $ne: true },
    };
    if (query.parentId) {
      filter.parentId = query.parentId;
    } else if (query.topLevelOnly) {
      filter.parentId = { $exists: false };
    }

    this.applyModerationFilter(filter, viewer, {
      ownerId: news.authorId,
    });

    const sort =
      query.sort === 'newest'
        ? ({ createdAt: -1 as const } as const)
        : ({ createdAt: 1 as const } as const);

    const items = await this.commentModel
      .find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .exec();

    const total = await this.commentModel.countDocuments(filter).exec();
    const hasMore = skip + items.length < total;

    return { items, page, limit, total, hasMore };
  }

  private applyModerationFilter(
    filter: QueryFilter<CommentDocument>,
    viewer: JwtUser | undefined,
    opts: { ownerId?: string },
  ) {
    if (viewer?.role === 'admin') {
      // Admin sees everything including rejected
      return;
    }

    if (!viewer) {
      // Guest: approved only
      filter.moderationStatus = 'approved';
    } else if (opts.ownerId && viewer.id === opts.ownerId) {
      // Post/news owner: sees approved + pending + under_review from others,
      // but rejected is silently hidden for everyone except admin
      filter.moderationStatus = { $ne: 'rejected' } as any;
    } else {
      // Regular user: approved comments + their own pending/under_review (not rejected)
      filter['$or'] = [
        { moderationStatus: 'approved' },
        {
          authorId: viewer.id,
          moderationStatus: { $in: ['pending', 'under_review'] },
        },
      ];
    }
  }

  async listReplies(
    viewer: JwtUser | undefined,
    commentId: string,
    query: QueryCommentsDto,
  ) {
    const parent = await this.requireComment(commentId);

    if (parent.newsId) {
      return this.listForNews(viewer, String(parent.newsId), {
        ...query,
        parentId: String(parent._id),
        topLevelOnly: false,
      });
    }

    const post = await this.requirePost(String(parent.postId));
    assertCanReadPost(viewer, post);

    return this.listForPost(viewer, String(parent.postId), {
      ...query,
      parentId: String(parent._id),
      topLevelOnly: false,
    });
  }

  async createForPost(viewer: JwtUser, postId: string, dto: CreateCommentDto) {
    // ── Ban check ──
    const banStatus = await this.usersService.isBanned(viewer.id);
    if (banStatus.banned) {
      const isPermanent = banStatus.until && new Date(banStatus.until).getFullYear() >= 2099;
      const untilStr = isPermanent
        ? 'vĩnh viễn'
        : `đến ${new Date(banStatus.until!).toLocaleDateString('vi-VN')}`;
      throw new ForbiddenException(
        `Tài khoản của bạn đã bị khóa ${untilStr}. Lý do: ${banStatus.reason ?? 'Vi phạm chính sách cộng đồng'}`,
      );
    }

    const post = await this.requirePost(postId);
    assertCanReadPost(viewer, post);

    const contentPreview = String(dto.content ?? '')
      .trim()
      .replace(/\s+/g, ' ')
      .slice(0, 80);
    this.logger.log(
      `createForPost start postId=${postId} viewerId=${viewer.id} len=${String(dto.content ?? '').length} preview="${contentPreview}"`,
    );

    if (dto.parentId) {
      const parent = await this.requireComment(dto.parentId);
      if (String(parent.postId ?? '') !== String(postId)) {
        throw new ForbiddenException('Parent comment mismatch');
      }
      if (parent.isDeleted) {
        throw new ForbiddenException('Cannot reply to deleted comment');
      }
    }

    const created = await this.commentModel.create({
      postId,
      parentId: dto.parentId,
      authorId: viewer.id,
      content: dto.content,
      isDeleted: false,
      moderationStatus: 'pending',
    });

    this.logger.log(
      `createForPost created commentId=${String(created._id)} status=${created.moderationStatus} parentId=${dto.parentId ?? 'null'}`,
    );

    await this.enqueueModerationJob(String(created._id));
    this.pointsService
      .addPoints(viewer.id, 5, 'comment_create', { postId, commentId: String(created._id) })
      .catch(() => {});
    return created;
  }

  async createForNews(viewer: JwtUser, newsId: string, dto: CreateCommentDto) {
    // ── Ban check ──
    const banStatus = await this.usersService.isBanned(viewer.id);
    if (banStatus.banned) {
      const isPermanent = banStatus.until && new Date(banStatus.until).getFullYear() >= 2099;
      const untilStr = isPermanent
        ? 'vĩnh viễn'
        : `đến ${new Date(banStatus.until!).toLocaleDateString('vi-VN')}`;
      throw new ForbiddenException(
        `Tài khoản của bạn đã bị khóa ${untilStr}. Lý do: ${banStatus.reason ?? 'Vi phạm chính sách cộng đồng'}`,
      );
    }

    await this.requirePublishedNews(newsId);

    const contentPreview = String(dto.content ?? '')
      .trim()
      .replace(/\s+/g, ' ')
      .slice(0, 80);
    this.logger.log(
      `createForNews start newsId=${newsId} viewerId=${viewer.id} len=${String(dto.content ?? '').length} preview="${contentPreview}"`,
    );

    if (dto.parentId) {
      const parent = await this.requireComment(dto.parentId);
      if (String(parent.newsId ?? '') !== String(newsId)) {
        throw new ForbiddenException('Parent comment mismatch');
      }
      if (parent.isDeleted) {
        throw new ForbiddenException('Cannot reply to deleted comment');
      }
    }

    const created = await this.commentModel.create({
      newsId,
      parentId: dto.parentId,
      authorId: viewer.id,
      content: dto.content,
      isDeleted: false,
      moderationStatus: 'pending',
    });

    this.logger.log(
      `createForNews created commentId=${String(created._id)} status=${created.moderationStatus} parentId=${dto.parentId ?? 'null'}`,
    );

    await this.enqueueModerationJob(String(created._id));
    this.pointsService
      .addPoints(viewer.id, 5, 'comment_create', { newsId, commentId: String(created._id) })
      .catch(() => {});
    return created;
  }

  private async enqueueModerationJob(commentId: string) {
    const jobRes = await this.jobModel.updateOne(
      { commentId },
      {
        $setOnInsert: {
          commentId,
          status: 'pending',
          attempts: 0,
        },
      },
      { upsert: true },
    );

    this.logger.log(
      `moderationJob upserted commentId=${commentId} matched=${(jobRes as any)?.matchedCount ?? '?'} upserted=${(jobRes as any)?.upsertedCount ?? '?'} acknowledged=${(jobRes as any)?.acknowledged ?? '?'}`,
    );
  }

  async update(viewer: JwtUser, commentId: string, dto: UpdateCommentDto) {
    const comment = await this.requireComment(commentId);
    assertCanEditComment(viewer, comment);
    if (comment.isDeleted) throw new ForbiddenException('Comment deleted');

    const patch: Partial<CommentDocument> = {};
    if (dto.content !== undefined) patch.content = dto.content;

    const contentChanged =
      dto.content !== undefined && dto.content !== comment.content;

    if (contentChanged) {
      this.logger.log(
        `update contentChanged commentId=${String(comment._id)} viewerId=${viewer.id} oldStatus=${comment.moderationStatus} -> pending`,
      );
      // Re-trigger AI moderation: reset status + clear stale AI data.
      (patch as any).moderationStatus = 'pending';
      (patch as any).sentiment = undefined;
      (patch as any).toxicity = undefined;
      (patch as any).sentiment4 = undefined;
      (patch as any).intent = undefined;
      (patch as any).aspects = undefined;
      (patch as any).sentiment4Scores = undefined;
      (patch as any).intentScores = undefined;
      (patch as any).aspectScores = undefined;
      (patch as any).aiVersion = undefined;
      (patch as any).aiError = undefined;
      (patch as any).qualityScore = undefined;
      (patch as any).aiEntities = undefined;

      if (comment.moderationStatus === 'approved') {
        await this.decrementApprovedCommentTarget(comment);
      }
    }

    const updated = await this.commentModel
      .findByIdAndUpdate(
        comment._id,
        { $set: patch },
        { returnDocument: 'after' },
      )
      .exec();
    if (!updated) throw new NotFoundException('Comment not found');

    if (contentChanged) {
      const jobRes = await this.jobModel.updateOne(
        { commentId: String(comment._id) },
        {
          $set: {
            status: 'pending',
            attempts: 0,
            lastError: undefined,
            nextRunAt: undefined,
            lockedAt: undefined,
          },
        },
        { upsert: true },
      );
      this.logger.log(
        `update moderationJob reset commentId=${String(comment._id)} matched=${(jobRes as any)?.matchedCount ?? '?'} modified=${(jobRes as any)?.modifiedCount ?? '?'} acknowledged=${(jobRes as any)?.acknowledged ?? '?'}`,
      );
    }

    return updated;
  }

  async remove(viewer: JwtUser, commentId: string) {
    const comment = await this.requireComment(commentId);
    assertCanEditComment(viewer, comment);

    if (comment.isDeleted) return { ok: true };

    await this.commentModel
      .updateOne(
        { _id: comment._id },
        {
          $set: {
            isDeleted: true,
            deletedAt: new Date(),
            content: '[deleted]',
          },
        },
      )
      .exec();

    if (comment.moderationStatus === 'approved') {
      await this.decrementApprovedCommentTarget(comment);
    }
    return { ok: true };
  }

  private async decrementApprovedCommentTarget(comment: CommentDocument) {
    if (comment.postId) {
      await this.postModel
        .updateOne({ _id: comment.postId }, [
          {
            $set: {
              commentCount: {
                $max: [0, { $subtract: ['$commentCount', 1] }],
              },
            },
          },
        ])
        .exec();
    } else if (comment.newsId) {
      await this.newsModel
        .updateOne({ _id: comment.newsId }, [
          {
            $set: {
              commentCount: {
                $max: [0, { $subtract: ['$commentCount', 1] }],
              },
            },
          },
        ])
        .exec();
    }
  }

  private async requireComment(commentId: string) {
    const comment = await this.commentModel.findById(commentId).exec();
    if (!comment) throw new NotFoundException('Comment not found');
    return comment;
  }

  private async requirePost(postId: string) {
    const post = await this.postModel.findById(postId).exec();
    if (!post) throw new NotFoundException('Post not found');
    return post;
  }

  private async requirePublishedNews(id: string) {
    const news = await this.newsModel.findById(id).exec();
    if (!news || news.status !== 'published')
      throw new NotFoundException('News not found');
    return news;
  }
}

function assertCanEditComment(viewer: JwtUser, comment: CommentDocument) {
  if (viewer.role === 'admin') return;
  if (comment.authorId === viewer.id) return;
  throw new ForbiddenException('Forbidden');
}
