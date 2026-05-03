import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import {
  CommentLikeModelName,
  type CommentLikeDocument,
} from '../models/comment-like.model';
import {
  CommentModelName,
  type CommentDocument,
} from '../models/comment.model';
import { PostModelName, type PostDocument } from '../models/post.model';
import { NewsModelName, type NewsDocument } from '../models/news.model';
import type { JwtUser } from '../types/auth';
import { assertCanReadPost } from '../utils/assert-can-read-post';

@Injectable()
export class CommentLikesService {
  constructor(
    @InjectModel(CommentLikeModelName)
    private readonly commentLikeModel: Model<CommentLikeDocument>,
    @InjectModel(CommentModelName)
    private readonly commentModel: Model<CommentDocument>,
    @InjectModel(PostModelName)
    private readonly postModel: Model<PostDocument>,
    @InjectModel(NewsModelName)
    private readonly newsModel: Model<NewsDocument>,
  ) {}

  async toggleLike(
    viewer: JwtUser,
    commentId: string,
  ): Promise<{ liked: boolean }> {
    const comment = await this.commentModel.findById(commentId).exec();
    if (!comment) throw new NotFoundException('Comment not found');
    if (comment.isDeleted) throw new ForbiddenException('Comment deleted');

    if (comment.postId) {
      const post = await this.postModel.findById(comment.postId).exec();
      if (!post) throw new NotFoundException('Post not found');
      assertCanReadPost(viewer, post);
    } else if (comment.newsId) {
      const news = await this.newsModel.findById(comment.newsId).exec();
      if (!news || news.status !== 'published')
        throw new NotFoundException('News not found');
    } else {
      throw new NotFoundException('Comment target not found');
    }

    const existing = await this.commentLikeModel
      .findOne({ commentId, userId: viewer.id })
      .exec();

    if (existing) {
      await existing.deleteOne();
      await this.commentModel
        .updateOne({ _id: comment._id }, [
          {
            $set: {
              likeCount: { $max: [0, { $subtract: ['$likeCount', 1] }] },
            },
          },
        ])
        .exec();
      return { liked: false };
    }

    try {
      await this.commentLikeModel.create({ commentId, userId: viewer.id });
    } catch {
      return { liked: true };
    }

    await this.commentModel
      .updateOne({ _id: comment._id }, { $inc: { likeCount: 1 } })
      .exec();
    return { liked: true };
  }
}
