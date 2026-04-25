import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import {
  CommentModerationJobModelName,
  type CommentModerationJobDocument,
} from '../models/comment-moderation-job.model';
import { CommentModelName, type CommentDocument } from '../models/comment.model';

@Injectable()
export class HealthService {
  constructor(
    @InjectModel(CommentModelName)
    private readonly commentModel: Model<CommentDocument>,
    @InjectModel(CommentModerationJobModelName)
    private readonly jobModel: Model<CommentModerationJobDocument>,
  ) {}

  async getHealth() {
    const [pending, approved, rejected] = await Promise.all([
      this.commentModel.countDocuments({ moderationStatus: 'pending' }).exec(),
      this.commentModel.countDocuments({ moderationStatus: 'approved' }).exec(),
      this.commentModel.countDocuments({ moderationStatus: 'rejected' }).exec(),
    ]);

    const [jobsPending, jobsFailed] = await Promise.all([
      this.jobModel.countDocuments({ status: 'pending' }).exec(),
      this.jobModel.countDocuments({ status: 'failed' }).exec(),
    ]);

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      moderation: {
        comments: { pending, approved, rejected },
        jobs: { pending: jobsPending, failed: jobsFailed },
      },
    };
  }
}
