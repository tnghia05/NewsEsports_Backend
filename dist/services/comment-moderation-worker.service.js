"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var CommentModerationWorkerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommentModerationWorkerService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const config_1 = require("@nestjs/config");
const comment_moderation_job_model_1 = require("../models/comment-moderation-job.model");
const comment_model_1 = require("../models/comment.model");
const post_model_1 = require("../models/post.model");
const news_model_1 = require("../models/news.model");
const user_model_1 = require("../models/user.model");
const ai_service_1 = require("../infra/ai/ai.service");
const notifications_service_1 = require("./notifications.service");
let CommentModerationWorkerService = CommentModerationWorkerService_1 = class CommentModerationWorkerService {
    config;
    jobModel;
    commentModel;
    postModel;
    newsModel;
    userModel;
    aiService;
    notificationsService;
    logger = new common_1.Logger(CommentModerationWorkerService_1.name);
    timer;
    running = false;
    confidenceThreshold;
    toxicReviewThreshold;
    constructor(config, jobModel, commentModel, postModel, newsModel, userModel, aiService, notificationsService) {
        this.config = config;
        this.jobModel = jobModel;
        this.commentModel = commentModel;
        this.postModel = postModel;
        this.newsModel = newsModel;
        this.userModel = userModel;
        this.aiService = aiService;
        this.notificationsService = notificationsService;
        this.confidenceThreshold = Number(this.config.get('AI_CONFIDENCE_THRESHOLD', { infer: true }) ?? 0.6);
        this.toxicReviewThreshold = Number(this.config.get('AI_TOXIC_REVIEW_THRESHOLD', { infer: true }) ?? 0.4);
    }
    onModuleInit() {
        this.timer = setInterval(() => void this.tick(), 1500);
    }
    onModuleDestroy() {
        if (this.timer)
            clearInterval(this.timer);
    }
    async tick() {
        if (this.running)
            return;
        this.running = true;
        try {
            for (let i = 0; i < 5; i++) {
                const job = await this.claimJob();
                if (!job)
                    break;
                this.logger.log(`claimJob ok jobId=${String(job._id)} commentId=${job.commentId} status=${job.status}`);
                await this.processJob(job).catch((e) => {
                    this.logger.warn(`Job ${job._id} failed: ${String(e?.message ?? e)}`);
                });
            }
        }
        finally {
            this.running = false;
        }
    }
    async claimJob() {
        const now = new Date();
        const stuckBefore = new Date(Date.now() - 2 * 60_000);
        return this.jobModel
            .findOneAndUpdate({
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
        }, { $set: { status: 'processing', lockedAt: now } }, { returnDocument: 'after' })
            .exec();
    }
    async processJob(job) {
        const comment = await this.commentModel.findById(job.commentId).exec();
        if (!comment) {
            await this.jobModel
                .updateOne({ _id: job._id }, { $set: { status: 'done' } })
                .exec();
            return;
        }
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
            this.logger.log(`processJob callAI jobId=${String(job._id)} commentId=${String(comment._id)} postId=${comment.postId ?? 'n/a'} newsId=${comment.newsId ?? 'n/a'} len=${String(comment.content ?? '').length} preview="${preview}"`);
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
            const rejected = ai.toxicity.isToxic;
            const inGrayZone = !rejected && ai.toxicity.score >= this.toxicReviewThreshold;
            const lowConfidence = !rejected &&
                !inGrayZone &&
                ai.confidence !== undefined &&
                ai.confidence < this.confidenceThreshold;
            const moderationStatus = rejected
                ? 'rejected'
                : inGrayZone || lowConfidence
                    ? 'under_review'
                    : 'approved';
            const qualityScore = computeQualityScore(ai);
            await this.commentModel
                .updateOne({ _id: comment._id }, {
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
            })
                .exec();
            this.logger.log(`processJob updated commentId=${String(comment._id)} status=${moderationStatus} sentiment=${ai.sentiment} sentiment4=${ai.sentiment4 ?? 'n/a'} toxic=${ai.toxicity.isToxic} score=${ai.toxicity.score} conf=${ai.confidence?.toFixed(3) ?? 'n/a'} quality=${qualityScore.toFixed(3)}`);
            if (moderationStatus === 'rejected') {
                const user = await this.userModel.findById(comment.authorId).exec();
                const now = new Date();
                const fiveMinutesAgo = new Date(now.getTime() - 5 * 60_000);
                const shouldWarn = !user?.lastWarnedAt || user.lastWarnedAt < fiveMinutesAgo;
                const newStrikeCount = (user?.toxicStrikeCount ?? 0) + 1;
                await this.userModel
                    .updateOne({ _id: comment.authorId }, {
                    $inc: { toxicStrikeCount: 1 },
                    ...(shouldWarn ? { $set: { lastWarnedAt: now } } : {}),
                })
                    .exec();
                if (shouldWarn) {
                    const postId = comment.postId ? String(comment.postId) : undefined;
                    const commentId = String(comment._id);
                    const strikeMsg = newStrikeCount >= 5
                        ? `⚠️ Cảnh báo lần ${newStrikeCount}: Tài khoản của bạn có nguy cơ bị khóa do vi phạm được phạt hiện nhiều lần. Vui lòng tuân thủ nội quy cộng đồng.`
                        : `⚠️ Bình luận của bạn đã bị AI phát hiện là độc hại (toxic score: ${(ai.toxicity.score * 100).toFixed(0)}%) và đã bị xóa. Đây là cảnh cáo lần ${newStrikeCount}.`;
                    await this.notificationsService.create({
                        userId: comment.authorId,
                        type: 'toxic_warning',
                        commentId,
                        postId,
                        message: strikeMsg,
                    });
                    this.logger.warn(`Toxic warning sent userId=${comment.authorId} strike=${newStrikeCount} score=${ai.toxicity.score.toFixed(3)}`);
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
                    }
                    else if (post.authorId !== comment.authorId) {
                        await this.notificationsService.create({
                            userId: post.authorId,
                            actorId: comment.authorId,
                            type: 'comment',
                            postId: String(post._id),
                            commentId: String(comment._id),
                        });
                    }
                }
                else if (news) {
                    await this.newsModel
                        .updateOne({ _id: news._id }, { $inc: { commentCount: 1 } })
                        .exec();
                }
            }
            await this.jobModel
                .updateOne({ _id: job._id }, { $set: { status: 'done', lastError: undefined } })
                .exec();
        }
        catch (e) {
            const attempts = (job.attempts ?? 0) + 1;
            const backoffMs = Math.min(60_000, 2000 * attempts);
            await this.commentModel
                .updateOne({ _id: comment._id }, { $set: { aiError: String(e?.message ?? e) } })
                .exec();
            await this.jobModel
                .updateOne({ _id: job._id }, {
                $set: {
                    status: attempts >= 10 ? 'failed' : 'pending',
                    attempts,
                    nextRunAt: new Date(Date.now() + backoffMs),
                    lastError: String(e?.message ?? e),
                },
            })
                .exec();
        }
    }
};
exports.CommentModerationWorkerService = CommentModerationWorkerService;
exports.CommentModerationWorkerService = CommentModerationWorkerService = CommentModerationWorkerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, mongoose_1.InjectModel)(comment_moderation_job_model_1.CommentModerationJobModelName)),
    __param(2, (0, mongoose_1.InjectModel)(comment_model_1.CommentModelName)),
    __param(3, (0, mongoose_1.InjectModel)(post_model_1.PostModelName)),
    __param(4, (0, mongoose_1.InjectModel)(news_model_1.NewsModelName)),
    __param(5, (0, mongoose_1.InjectModel)(user_model_1.UserModelName)),
    __metadata("design:paramtypes", [config_1.ConfigService, Function, Function, Function, Function, Function, ai_service_1.AiService,
        notifications_service_1.NotificationsService])
], CommentModerationWorkerService);
function computeQualityScore(ai) {
    const s = ai.intentScores ?? {};
    const praise = Number(s['praise'] ?? 0);
    const question = Number(s['question'] ?? 0);
    const other = Number(s['other'] ?? 0);
    const complain = Number(s['complain'] ?? 0);
    const toxicPenalty = ai.toxicity.score;
    const raw = praise * 1.0 + question * 0.7 + other * 0.3 - complain * 0.2 - toxicPenalty * 1.0;
    return Math.max(-1, Math.min(1, raw));
}
//# sourceMappingURL=comment-moderation-worker.service.js.map