import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import {
  PostLikeModelName,
  type PostLikeDocument,
} from '../models/post-like.model';
import { PostModelName, type PostDocument } from '../models/post.model';
import type { JwtUser } from '../types/auth';

@Injectable()
export class PostLikesService {
  constructor(
    @InjectModel(PostLikeModelName)
    private readonly postLikeModel: Model<PostLikeDocument>,
    @InjectModel(PostModelName)
    private readonly postModel: Model<PostDocument>,
  ) {}

  async toggleLike(viewer: JwtUser, postId: string): Promise<{ liked: boolean }> {
    const post = await this.postModel.findById(postId).exec();
    if (!post) throw new NotFoundException('Post not found');

    assertCanReadPost(viewer, post);

    const existing = await this.postLikeModel
      .findOne({ postId, userId: viewer.id })
      .exec();

    if (existing) {
      await existing.deleteOne();
      await this.postModel
        .updateOne(
          { _id: post._id },
          [
            {
              $set: {
                likeCount: { $max: [0, { $subtract: ['$likeCount', 1] }] },
              },
            },
          ],
        )
        .exec();
      return { liked: false };
    }

    try {
      await this.postLikeModel.create({ postId, userId: viewer.id });
    } catch {
      // Unique race: if two likes happen concurrently, treat as liked.
      return { liked: true };
    }

    await this.postModel
      .updateOne({ _id: post._id }, { $inc: { likeCount: 1 } })
      .exec();
    return { liked: true };
  }
}

function assertCanReadPost(viewer: JwtUser, post: PostDocument) {
  if (post.status === 'published') return;
  if (viewer.role === 'admin') return;
  if (post.authorId === viewer.id) return;
  throw new ForbiddenException('Forbidden');
}

