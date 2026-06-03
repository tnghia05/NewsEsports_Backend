import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
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
import { UserModelName, type UserDocument } from '../models/user.model';
import { AiService, type AiModerationResult } from '../infra/ai/ai.service';
import { NotificationsService } from './notifications.service';

@Injectable()
export class CommentModerationWorkerService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(CommentModerationWorkerService.name);
  private timer?: NodeJS.Timeout;
  private running = false;
  private readonly confidenceThreshold: number;
  private readonly toxicReviewThreshold: number;

  constructor(
    private readonly config: ConfigService,
    @InjectModel(CommentModerationJobModelName)
    private readonly jobModel: Model<CommentModerationJobDocument>,
    @InjectModel(CommentModelName)
    private readonly commentModel: Model<CommentDocument>,
    @InjectModel(PostModelName)
    private readonly postModel: Model<PostDocument>,
    @InjectModel(NewsModelName)
    private readonly newsModel: Model<NewsDocument>,
    @InjectModel(UserModelName)
    private readonly userModel: Model<UserDocument>,
    private readonly aiService: AiService,
    private readonly notificationsService: NotificationsService,
  ) {
    this.confidenceThreshold = Number(
      this.config.get<string>('AI_CONFIDENCE_THRESHOLD', { infer: true }) ?? 0.6,
    );
    this.toxicReviewThreshold = Number(
      this.config.get<string>('AI_TOXIC_REVIEW_THRESHOLD', { infer: true }) ?? 0.4,
    );
  }

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

      // #12 Context-aware: prepend parent comment content when replying
      let textToAnalyze = comment.content;
      if (comment.parentId) {
        const parent = await this.commentModel
          .findById(comment.parentId)
          .select({ content: 1 })
          .lean()
          .exec();
        if (parent?.content) {
          const parentSnippet = String(parent.content)
            .trim()
            .replace(/\s+/g, ' ')
            .slice(0, 200);
          textToAnalyze = `${parentSnippet} [SEP] ${comment.content}`;
        }
      }

      const ai = await this.aiService.analyzeComment(textToAnalyze);

      // Routing logic (3 zones):
      //   score >= AI_TOXIC_THRESHOLD (0.7)      → rejected
      //   score >= AI_TOXIC_REVIEW_THRESHOLD (0.4) → under_review (admin check)
      //   confidence < AI_CONFIDENCE_THRESHOLD (0.6) → under_review (model unsure)
      //   otherwise                              → approved
      const rejected = ai.toxicity.isToxic;
      const inGrayZone =
        !rejected && ai.toxicity.score >= this.toxicReviewThreshold;
      const lowConfidence =
        !rejected &&
        !inGrayZone &&
        ai.confidence !== undefined &&
        ai.confidence < this.confidenceThreshold;
      const moderationStatus =
        rejected
          ? 'rejected'
          : inGrayZone || lowConfidence
            ? 'under_review'
            : 'approved';

      // #10 Quality score: soft-probability weighted formula
      const qualityScore = computeQualityScore(ai);

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
              qualityScore,
              aiEntities: ai.entities,
              moderationStatus,
            },
          },
        )
        .exec();

      this.logger.log(
        `processJob updated commentId=${String(comment._id)} status=${moderationStatus} sentiment=${ai.sentiment} sentiment4=${ai.sentiment4 ?? 'n/a'} toxic=${ai.toxicity.isToxic} score=${ai.toxicity.score} conf=${ai.confidence?.toFixed(3) ?? 'n/a'} quality=${qualityScore.toFixed(3)}`,
      );

      // ── If REJECTED: send toxic warning + increment strike count ──
      if (moderationStatus === 'rejected') {
        // Throttle: only 1 warning per 5 minutes per user
        const user = await this.userModel.findById(comment.authorId).exec();
        const now = new Date();
        const fiveMinutesAgo = new Date(now.getTime() - 5 * 60_000);
        const shouldWarn = !user?.lastWarnedAt || user.lastWarnedAt < fiveMinutesAgo;

        // Increment strike count
        const newStrikeCount = (user?.toxicStrikeCount ?? 0) + 1;
        await this.userModel
          .updateOne(
            { _id: comment.authorId },
            {
              $inc: { toxicStrikeCount: 1 },
              ...(shouldWarn ? { $set: { lastWarnedAt: now } } : {}),
            },
          )
          .exec();

        if (shouldWarn) {
          const postId = comment.postId ? String(comment.postId) : undefined;
          const commentId = String(comment._id);
          const strikeMsg =
            newStrikeCount >= 5
              ? `⚠️ Cảnh báo lần ${newStrikeCount}: Tài khoản của bạn có nguy cơ bị khóa do vi phạm được phạt hiện nhiều lần. Vui lòng tuân thủ nội quy cộng đồng.`
              : `⚠️ Bình luận của bạn đã bị AI phát hiện là độc hại (toxic score: ${(ai.toxicity.score * 100).toFixed(0)}%) và đã bị xóa. Đây là cảnh cáo lần ${newStrikeCount}.`;

          await this.notificationsService.create({
            userId: comment.authorId,
            type: 'toxic_warning',
            commentId,
            postId,
            message: strikeMsg,
          });

          this.logger.warn(
            `Toxic warning sent userId=${comment.authorId} strike=${newStrikeCount} score=${ai.toxicity.score.toFixed(3)}`,
          );
        }
      }

      if (moderationStatus === 'approved') {
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

// #10 Quality score: uses soft intent probabilities for nuanced scoring.
// Range: -1.0 (worst) .. +1.0 (best).
function computeQualityScore(ai: AiModerationResult): number {
  const s = ai.intentScores ?? {};
  const praise = Number(s['praise'] ?? 0);
  const question = Number(s['question'] ?? 0);
  const other = Number(s['other'] ?? 0);
  const complain = Number(s['complain'] ?? 0);
  const toxicPenalty = ai.toxicity.score;

  const raw =
    praise * 1.0 + question * 0.7 + other * 0.3 - complain * 0.2 - toxicPenalty * 1.0;
  return Math.max(-1, Math.min(1, raw));
}
