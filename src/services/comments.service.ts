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

@Injectable()
export class CommentsService {
  constructor(
    @InjectModel(CommentModelName)
    private readonly commentModel: Model<CommentDocument>,
    @InjectModel(PostModelName)
    private readonly postModel: Model<PostDocument>,
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

    const items = await this.commentModel
      .find({ postId } satisfies QueryFilter<CommentDocument>)
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(limit)
      .exec();

    return { items, page, limit };
  }

  async createForPost(viewer: JwtUser, postId: string, dto: CreateCommentDto) {
    const post = await this.requirePost(postId);
    assertCanReadPost(viewer, post);

    const created = await this.commentModel.create({
      postId,
      authorId: viewer.id,
      content: dto.content,
    });

    await this.postModel
      .updateOne({ _id: post._id }, { $inc: { commentCount: 1 } })
      .exec();

    return created;
  }

  async update(viewer: JwtUser, commentId: string, dto: UpdateCommentDto) {
    const comment = await this.requireComment(commentId);
    assertCanEditComment(viewer, comment);

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

    await comment.deleteOne();
    await this.postModel
      .updateOne({ _id: comment.postId }, { $inc: { commentCount: -1 } })
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

