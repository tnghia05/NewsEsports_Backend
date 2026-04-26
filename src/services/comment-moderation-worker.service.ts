import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import {
  CommentModerationJobModelName,
  type CommentModerationJobDocument,
} from '../models/comment-moderation-job.model';
import { CommentModelName, type CommentDocument } from '../models/comment.model';
import { PostModelName, type PostDocument } from '../models/post.model';
import { AiService } from '../infra/ai/ai.service';
import { NotificationsService } from './notifications.service';

@Injectable()
export class CommentModerationWorkerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CommentModerationWorkerService.name);
  private timer?: NodeJS.Timeout;
  private running = false;

  constructor(
    @InjectModel(CommentModerationJobModelName)
    private readonly jobModel: Model<CommentModerationJobDocument>,
    @InjectModel(CommentModelName)
    private readonly commentModel: Model<CommentDocument>,
    @InjectModel(PostModelName)
    private readonly postModel: Model<PostDocument>,
    private readonly aiService: AiService,
    private readonly notificationsService: NotificationsService,
  ) {}

  onModuleInit() {
    // Lightweight polling worker. In production you'd likely use BullMQ/Redis.
    this.timer = setInterval(() => void this.tick(), 1500);
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  private async tick() {
    if (this.running) return;
    this.running = true;
    try {
      // process up to a few jobs per tick
      for (let i = 0; i < 5; i++) {
        const job = await this.claimJob();
        if (!job) break;
        await this.processJob(job).catch((e) => {
          this.logger.warn(`Job ${job._id} failed: ${String(e?.message ?? e)}`);
        });
      }
    } finally {
      this.running = false;
    }
  }

  private async claimJob() {
    const now = new Date();
    return this.jobModel
      .findOneAndUpdate(
        {
          status: 'pending',
          $or: [{ nextRunAt: { $exists: false } }, { nextRunAt: { $lte: now } }],
        },
        { $set: { status: 'processing', lockedAt: now } },
        // Mongoose forwards options to Mongo driver; `new` is deprecated in driver.
        { returnDocument: 'after' },
      )
      .exec();
  }

  private async processJob(job: CommentModerationJobDocument) {
    this.logger.log(`processJob start jobId=${String(job._id)} commentId=${job.commentId}`);
    const comment = await this.commentModel.findById(job.commentId).exec();
    if (!comment) {
      await this.jobModel
        .updateOne({ _id: job._id }, { $set: { status: 'done' } })
        .exec();
      return;
    }

    // If already moderated, finish job.
    if (comment.moderationStatus !== 'pending') {
      await this.jobModel
        .updateOne({ _id: job._id }, { $set: { status: 'done' } })
        .exec();
      return;
    }

    const post = await this.postModel.findById(comment.postId).exec();
    if (!post) {
      await this.jobModel
        .updateOne({ _id: job._id }, { $set: { status: 'done' } })
        .exec();
      return;
    }

    try {
      const started = Date.now();
      const ai = await this.aiService.analyzeComment(comment.content);
      const rejected = ai.toxicity.isToxic;
      const elapsed = Date.now() - started;
      this.logger.log(
        `processJob aiOk jobId=${String(job._id)} commentId=${String(comment._id)} in ${elapsed}ms sentiment=${ai.sentiment} toxic=${ai.toxicity.isToxic} score=${ai.toxicity.score.toFixed(
          3,
        )} aiVersion=${ai.aiVersion ?? 'n/a'}`,
      );

      await this.commentModel
        .updateOne(
          { _id: comment._id },
          {
            $set: {
              sentiment: ai.sentiment,
              toxicity: ai.toxicity,
              aiVersion: ai.aiVersion,
              aiError: undefined,
              moderationStatus: rejected ? 'rejected' : 'approved',
            },
          },
        )
        .exec();

      if (!rejected) {
        // Increase commentCount only when approved
        await this.postModel
          .updateOne({ _id: post._id }, { $inc: { commentCount: 1 } })
          .exec();

        // Notifications only on approved comments
        if (comment.parentId) {
          const parent = await this.commentModel.findById(comment.parentId).exec();
          if (parent) {
            await this.notificationsService.create({
              userId: parent.authorId,
              actorId: comment.authorId,
              type: 'reply',
              postId: String(post._id),
              commentId: String(comment._id),
            });
          }
        } else {
          await this.notificationsService.create({
            userId: post.authorId,
            actorId: comment.authorId,
            type: 'comment',
            postId: String(post._id),
            commentId: String(comment._id),
          });
        }
      }

      await this.jobModel
        .updateOne({ _id: job._id }, { $set: { status: 'done', lastError: undefined } })
        .exec();
    } catch (e: any) {
      const attempts = (job.attempts ?? 0) + 1;
      const backoffMs = Math.min(60_000, 2000 * attempts);
      this.logger.warn(
        `processJob aiFail jobId=${String(job._id)} commentId=${String(job.commentId)} attempts=${attempts}: ${String(
          e?.message ?? e,
        )}`,
      );
      await this.commentModel
        .updateOne(
          { _id: comment._id },
          { $set: { aiError: String(e?.message ?? e) } },
        )
        .exec();
      await this.jobModel
        .updateOne(
          { _id: job._id },
          {
            $set: {
              status: attempts >= 10 ? 'failed' : 'pending',
              attempts,
              nextRunAt: new Date(Date.now() + backoffMs),
              lastError: String(e?.message ?? e),
            },
          },
        )
        .exec();
    }
  }
}

