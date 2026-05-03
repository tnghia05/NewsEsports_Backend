import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import {
  CommentModerationJobModelName,
  type CommentModerationJobDocument,
} from '../models/comment-moderation-job.model';
import {
  CommentModelName,
  type CommentDocument,
} from '../models/comment.model';
import { PostModelName, type PostDocument } from '../models/post.model';
import { NewsModelName, type NewsDocument } from '../models/news.model';
import { AiService } from '../infra/ai/ai.service';
import { NotificationsService } from './notifications.service';

@Injectable()
export class CommentModerationWorkerService
  implements OnModuleInit, OnModuleDestroy
{
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
    @InjectModel(NewsModelName)
    private readonly newsModel: Model<NewsDocument>,
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
        this.logger.log(
          `claimJob ok jobId=${String(job._id)} commentId=${job.commentId} status=${job.status}`,
        );
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
    const stuckBefore = new Date(Date.now() - 2 * 60_000); // 2 min timeout
    return this.jobModel
      .findOneAndUpdate(
        {
          $or: [
            {
              status: 'pending',
              $or: [
                { nextRunAt: { $exists: false } },
                { nextRunAt: { $lte: now } },
              ],
            },
            { status: 'processing', lockedAt: { $lt: stuckBefore } },
          ],
        },
        { $set: { status: 'processing', lockedAt: now } },
        { returnDocument: 'after' },
      )
      .exec();
  }

  private async processJob(job: CommentModerationJobDocument) {
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

    const post = comment.postId
      ? await this.postModel.findById(comment.postId).exec()
      : null;
    const news = comment.newsId
      ? await this.newsModel.findById(comment.newsId).exec()
      : null;
    if (!post && !news) {
      await this.jobModel
        .updateOne({ _id: job._id }, { $set: { status: 'done' } })
        .exec();
      return;
    }

    try {
      const preview = String(comment.content ?? '')
        .trim()
        .replace(/\s+/g, ' ')
        .slice(0, 80);
      this.logger.log(
        `processJob callAI jobId=${String(job._id)} commentId=${String(comment._id)} postId=${comment.postId ?? 'n/a'} newsId=${comment.newsId ?? 'n/a'} len=${String(comment.content ?? '').length} preview="${preview}"`,
      );
      const ai = await this.aiService.analyzeComment(comment.content);
      const rejected = ai.toxicity.isToxic;

      await this.commentModel
        .updateOne(
          { _id: comment._id },
          {
            $set: {
              sentiment: ai.sentiment,
              toxicity: ai.toxicity,
              sentiment4: ai.sentiment4,
              intent: ai.intent,
              aspects: ai.aspects,
              sentiment4Scores: ai.sentiment4Scores,
              intentScores: ai.intentScores,
              aspectScores: ai.aspectScores,
              aiVersion: ai.aiVersion,
              aiError: undefined,
              moderationStatus: rejected ? 'rejected' : 'approved',
            },
          },
        )
        .exec();

      this.logger.log(
        `processJob updated commentId=${String(comment._id)} status=${rejected ? 'rejected' : 'approved'} sentiment=${ai.sentiment} sentiment4=${ai.sentiment4 ?? 'n/a'} toxic=${ai.toxicity.isToxic} score=${ai.toxicity.score}`,
      );

      if (!rejected) {
        if (post) {
          await this.postModel
            .updateOne({ _id: post._id }, { $inc: { commentCount: 1 } })
            .exec();

          if (comment.parentId) {
            const parent = await this.commentModel
              .findById(comment.parentId)
              .exec();
            if (parent && parent.authorId !== comment.authorId) {
              await this.notificationsService.create({
                userId: parent.authorId,
                actorId: comment.authorId,
                type: 'reply',
                postId: String(post._id),
                commentId: String(comment._id),
              });
            }
          } else if (post.authorId !== comment.authorId) {
            await this.notificationsService.create({
              userId: post.authorId,
              actorId: comment.authorId,
              type: 'comment',
              postId: String(post._id),
              commentId: String(comment._id),
            });
          }
        } else if (news) {
          await this.newsModel
            .updateOne({ _id: news._id }, { $inc: { commentCount: 1 } })
            .exec();
          // Notifications model is post-centric; skip push for news comments for now.
        }
      }

      await this.jobModel
        .updateOne(
          { _id: job._id },
          { $set: { status: 'done', lastError: undefined } },
        )
        .exec();
    } catch (e: any) {
      const attempts = (job.attempts ?? 0) + 1;
      const backoffMs = Math.min(60_000, 2000 * attempts);
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
