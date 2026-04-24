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

@Injectable()
export class CommentsService {
  constructor(
    @InjectModel(CommentModelName)
    private readonly commentModel: Model<CommentDocument>,
    @InjectModel(PostModelName)
    private readonly postModel: Model<PostDocument>,
    private readonly notificationsService: NotificationsService,
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
    });

    await this.postModel
      .updateOne({ _id: post._id }, { $inc: { commentCount: 1 } })
      .exec();

    // Notify post owner on comment
    if (!dto.parentId) {
      await this.notificationsService.create({
        userId: post.authorId,
        actorId: viewer.id,
        type: 'comment',
        postId: String(post._id),
        commentId: String(created._id),
      });
    } else if (parentAuthorId) {
      // Notify parent comment owner on reply
      await this.notificationsService.create({
        userId: parentAuthorId,
        actorId: viewer.id,
        type: 'reply',
        postId: String(post._id),
        commentId: String(created._id),
      });
    }

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

    // Clamp commentCount to >= 0 even under concurrent deletes.
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

