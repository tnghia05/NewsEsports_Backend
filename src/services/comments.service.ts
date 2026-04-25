import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model, QueryFilter } from 'mongoose';
import {
  CommentModelName,
  type CommentDocument,
} from '../models/comment.model';
import { PostModelName, type PostDocument } from '../models/post.model';
import type { JwtUser } from '../types/auth';
import type { QueryCommentsDto } from '../dto/comments/query-comments.dto';
import type { CreateCommentDto } from '../dto/comments/create-comment.dto';
import type { UpdateCommentDto } from '../dto/comments/update-comment.dto';
import { NotificationsService } from './notifications.service';
import {
  CommentModerationJobModelName,
  type CommentModerationJobDocument,
} from '../models/comment-moderation-job.model';

@Injectable()
export class CommentsService {
  constructor(
    @InjectModel(CommentModelName)
    private readonly commentModel: Model<CommentDocument>,
    @InjectModel(PostModelName)
    private readonly postModel: Model<PostDocument>,
    private readonly notificationsService: NotificationsService,
    @InjectModel(CommentModerationJobModelName)
    private readonly jobModel: Model<CommentModerationJobDocument>,
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

    const filter: QueryFilter<CommentDocument> = { postId };
    if (query.parentId) {
      filter.parentId = query.parentId;
    } else if (query.topLevelOnly) {
      filter.parentId = { $exists: false };
    }

    // Moderation visibility:
    // - Public viewers see only approved.
    // - Admin sees all.
    // - Post owner sees all (to moderate community).
    // - Comment owner sees their own pending/rejected + all approved.
    if (!viewer) {
      filter.moderationStatus = 'approved';
    } else if (viewer.role === 'admin' || viewer.id === post.authorId) {
      // no extra filter
    } else {
      filter['$or'] = [
        { moderationStatus: 'approved' },
        { authorId: viewer.id },
      ] as any;
    }

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

  async listReplies(
    viewer: JwtUser | undefined,
    commentId: string,
    query: QueryCommentsDto,
  ) {
    const parent = await this.requireComment(commentId);
    const post = await this.requirePost(parent.postId);
    assertCanReadPost(viewer, post);

    // Force parentId filter, ignore any conflicting query.parentId/topLevelOnly
    return this.listForPost(viewer, parent.postId, {
      ...query,
      parentId: String(parent._id),
      topLevelOnly: false,
    });
  }

  async createForPost(viewer: JwtUser, postId: string, dto: CreateCommentDto) {
    const post = await this.requirePost(postId);
    assertCanReadPost(viewer, post);

    let parentAuthorId: string | undefined;
    if (dto.parentId) {
      const parent = await this.requireComment(dto.parentId);
      if (parent.postId !== postId) {
        throw new ForbiddenException('Parent comment mismatch');
      }
      if (parent.isDeleted) {
        throw new ForbiddenException('Cannot reply to deleted comment');
      }
      parentAuthorId = parent.authorId;
    }

    const created = await this.commentModel.create({
      postId,
      parentId: dto.parentId,
      authorId: viewer.id,
      content: dto.content,
      isDeleted: false,
      moderationStatus: 'pending',
    });

    // Do NOT increment commentCount yet; only increment when approved by AI.
    await this.jobModel.updateOne(
      { commentId: String(created._id) },
      {
        $setOnInsert: {
          commentId: String(created._id),
          status: 'pending',
          attempts: 0,
        },
      },
      { upsert: true },
    );

    return created;
  }

  async update(viewer: JwtUser, commentId: string, dto: UpdateCommentDto) {
    const comment = await this.requireComment(commentId);
    assertCanEditComment(viewer, comment);
    if (comment.isDeleted) throw new ForbiddenException('Comment deleted');

    const patch: Partial<CommentDocument> = {};
    if (dto.content !== undefined) patch.content = dto.content;

    const updated = await this.commentModel
      .findByIdAndUpdate(comment._id, { $set: patch }, { new: true })
      .exec();
    if (!updated) throw new NotFoundException('Comment not found');
    return updated;
  }

  async remove(viewer: JwtUser, commentId: string) {
    const comment = await this.requireComment(commentId);
    assertCanEditComment(viewer, comment);

    if (comment.isDeleted) return { ok: true };

    await this.commentModel
      .updateOne(
        { _id: comment._id },
        { $set: { isDeleted: true, deletedAt: new Date(), content: '[deleted]' } },
      )
      .exec();

    // Only decrement commentCount if the comment was approved/visible.
    if (comment.moderationStatus === 'approved') {
      await this.postModel
        .updateOne(
          { _id: comment.postId },
          [
            {
              $set: {
                commentCount: {
                  $max: [0, { $subtract: ['$commentCount', 1] }],
                },
              },
            },
          ],
        )
        .exec();
    }
    return { ok: true };
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
}

function assertCanReadPost(viewer: JwtUser | undefined, post: PostDocument) {
  if (post.status === 'published') return;
  if (!viewer) throw new ForbiddenException('Forbidden');
  if (viewer.role === 'admin') return;
  if (post.authorId === viewer.id) return;
  throw new ForbiddenException('Forbidden');
}

function assertCanEditComment(viewer: JwtUser, comment: CommentDocument) {
  if (viewer.role === 'admin') return;
  if (comment.authorId === viewer.id) return;
  throw new ForbiddenException('Forbidden');
}

