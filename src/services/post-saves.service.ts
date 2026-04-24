import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { PostSaveModelName, type PostSaveDocument } from '../models/post-save.model';
import { PostModelName, type PostDocument } from '../models/post.model';
import type { JwtUser } from '../types/auth';

@Injectable()
export class PostSavesService {
  constructor(
    @InjectModel(PostSaveModelName)
    private readonly postSaveModel: Model<PostSaveDocument>,
    @InjectModel(PostModelName)
    private readonly postModel: Model<PostDocument>,
  ) {}

  async toggleSave(viewer: JwtUser, postId: string): Promise<{ saved: boolean }> {
    const post = await this.postModel.findById(postId).exec();
    if (!post) throw new NotFoundException('Post not found');

    assertCanReadPost(viewer, post);

    const existing = await this.postSaveModel
      .findOne({ postId, userId: viewer.id })
      .exec();

    if (existing) {
      await existing.deleteOne();
      return { saved: false };
    }

    try {
      await this.postSaveModel.create({ postId, userId: viewer.id });
    } catch {
      return { saved: true };
    }

    return { saved: true };
  }
}

function assertCanReadPost(viewer: JwtUser, post: PostDocument) {
  if (post.status === 'published') return;
  if (viewer.role === 'admin') return;
  if (post.authorId === viewer.id) return;
  throw new ForbiddenException('Forbidden');
}

