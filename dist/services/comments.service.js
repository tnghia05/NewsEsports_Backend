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
var CommentsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommentsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const comment_model_1 = require("../models/comment.model");
const post_model_1 = require("../models/post.model");
const news_model_1 = require("../models/news.model");
const notifications_service_1 = require("./notifications.service");
const comment_moderation_job_model_1 = require("../models/comment-moderation-job.model");
const assert_can_read_post_1 = require("../utils/assert-can-read-post");
let CommentsService = CommentsService_1 = class CommentsService {
    commentModel;
    postModel;
    newsModel;
    notificationsService;
    jobModel;
    logger = new common_1.Logger(CommentsService_1.name);
    constructor(commentModel, postModel, newsModel, notificationsService, jobModel) {
        this.commentModel = commentModel;
        this.postModel = postModel;
        this.newsModel = newsModel;
        this.notificationsService = notificationsService;
        this.jobModel = jobModel;
    }
    async listForPost(viewer, postId, query) {
        const post = await this.requirePost(postId);
        (0, assert_can_read_post_1.assertCanReadPost)(viewer, post);
        const page = query.page;
        const limit = query.limit;
        const skip = (page - 1) * limit;
        const filter = {
            postId,
            isDeleted: { $ne: true },
        };
        if (query.parentId) {
            filter.parentId = query.parentId;
        }
        else if (query.topLevelOnly) {
            filter.parentId = { $exists: false };
        }
        this.applyModerationFilter(filter, viewer, {
            ownerId: post.authorId,
        });
        const sort = query.sort === 'newest'
            ? { createdAt: -1 }
            : { createdAt: 1 };
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
    async listForNews(viewer, newsId, query) {
        const news = await this.requirePublishedNews(newsId);
        const page = query.page;
        const limit = query.limit;
        const skip = (page - 1) * limit;
        const filter = {
            newsId,
            isDeleted: { $ne: true },
        };
        if (query.parentId) {
            filter.parentId = query.parentId;
        }
        else if (query.topLevelOnly) {
            filter.parentId = { $exists: false };
        }
        this.applyModerationFilter(filter, viewer, {
            ownerId: news.authorId,
        });
        const sort = query.sort === 'newest'
            ? { createdAt: -1 }
            : { createdAt: 1 };
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
    applyModerationFilter(filter, viewer, opts) {
        if (!viewer) {
            filter.moderationStatus = 'approved';
        }
        else if (viewer.role === 'admin' ||
            (opts.ownerId && viewer.id === opts.ownerId)) {
        }
        else {
            filter['$or'] = [
                { moderationStatus: 'approved' },
                { authorId: viewer.id },
            ];
        }
    }
    async listReplies(viewer, commentId, query) {
        const parent = await this.requireComment(commentId);
        if (parent.newsId) {
            return this.listForNews(viewer, String(parent.newsId), {
                ...query,
                parentId: String(parent._id),
                topLevelOnly: false,
            });
        }
        const post = await this.requirePost(String(parent.postId));
        (0, assert_can_read_post_1.assertCanReadPost)(viewer, post);
        return this.listForPost(viewer, String(parent.postId), {
            ...query,
            parentId: String(parent._id),
            topLevelOnly: false,
        });
    }
    async createForPost(viewer, postId, dto) {
        const post = await this.requirePost(postId);
        (0, assert_can_read_post_1.assertCanReadPost)(viewer, post);
        const contentPreview = String(dto.content ?? '')
            .trim()
            .replace(/\s+/g, ' ')
            .slice(0, 80);
        this.logger.log(`createForPost start postId=${postId} viewerId=${viewer.id} len=${String(dto.content ?? '').length} preview="${contentPreview}"`);
        if (dto.parentId) {
            const parent = await this.requireComment(dto.parentId);
            if (String(parent.postId ?? '') !== String(postId)) {
                throw new common_1.ForbiddenException('Parent comment mismatch');
            }
            if (parent.isDeleted) {
                throw new common_1.ForbiddenException('Cannot reply to deleted comment');
            }
        }
        const created = await this.commentModel.create({
            postId,
            parentId: dto.parentId,
            authorId: viewer.id,
            content: dto.content,
            isDeleted: false,
            moderationStatus: 'pending',
        });
        this.logger.log(`createForPost created commentId=${String(created._id)} status=${created.moderationStatus} parentId=${dto.parentId ?? 'null'}`);
        await this.enqueueModerationJob(String(created._id));
        return created;
    }
    async createForNews(viewer, newsId, dto) {
        await this.requirePublishedNews(newsId);
        const contentPreview = String(dto.content ?? '')
            .trim()
            .replace(/\s+/g, ' ')
            .slice(0, 80);
        this.logger.log(`createForNews start newsId=${newsId} viewerId=${viewer.id} len=${String(dto.content ?? '').length} preview="${contentPreview}"`);
        if (dto.parentId) {
            const parent = await this.requireComment(dto.parentId);
            if (String(parent.newsId ?? '') !== String(newsId)) {
                throw new common_1.ForbiddenException('Parent comment mismatch');
            }
            if (parent.isDeleted) {
                throw new common_1.ForbiddenException('Cannot reply to deleted comment');
            }
        }
        const created = await this.commentModel.create({
            newsId,
            parentId: dto.parentId,
            authorId: viewer.id,
            content: dto.content,
            isDeleted: false,
            moderationStatus: 'pending',
        });
        this.logger.log(`createForNews created commentId=${String(created._id)} status=${created.moderationStatus} parentId=${dto.parentId ?? 'null'}`);
        await this.enqueueModerationJob(String(created._id));
        return created;
    }
    async enqueueModerationJob(commentId) {
        const jobRes = await this.jobModel.updateOne({ commentId }, {
            $setOnInsert: {
                commentId,
                status: 'pending',
                attempts: 0,
            },
        }, { upsert: true });
        this.logger.log(`moderationJob upserted commentId=${commentId} matched=${jobRes?.matchedCount ?? '?'} upserted=${jobRes?.upsertedCount ?? '?'} acknowledged=${jobRes?.acknowledged ?? '?'}`);
    }
    async update(viewer, commentId, dto) {
        const comment = await this.requireComment(commentId);
        assertCanEditComment(viewer, comment);
        if (comment.isDeleted)
            throw new common_1.ForbiddenException('Comment deleted');
        const patch = {};
        if (dto.content !== undefined)
            patch.content = dto.content;
        const contentChanged = dto.content !== undefined && dto.content !== comment.content;
        if (contentChanged) {
            this.logger.log(`update contentChanged commentId=${String(comment._id)} viewerId=${viewer.id} oldStatus=${comment.moderationStatus} -> pending`);
            patch.moderationStatus = 'pending';
            patch.sentiment = undefined;
            patch.toxicity = undefined;
            patch.sentiment4 = undefined;
            patch.intent = undefined;
            patch.aspects = undefined;
            patch.sentiment4Scores = undefined;
            patch.intentScores = undefined;
            patch.aspectScores = undefined;
            patch.aiVersion = undefined;
            patch.aiError = undefined;
            if (comment.moderationStatus === 'approved') {
                await this.decrementApprovedCommentTarget(comment);
            }
        }
        const updated = await this.commentModel
            .findByIdAndUpdate(comment._id, { $set: patch }, { returnDocument: 'after' })
            .exec();
        if (!updated)
            throw new common_1.NotFoundException('Comment not found');
        if (contentChanged) {
            const jobRes = await this.jobModel.updateOne({ commentId: String(comment._id) }, {
                $set: {
                    status: 'pending',
                    attempts: 0,
                    lastError: undefined,
                    nextRunAt: undefined,
                    lockedAt: undefined,
                },
            }, { upsert: true });
            this.logger.log(`update moderationJob reset commentId=${String(comment._id)} matched=${jobRes?.matchedCount ?? '?'} modified=${jobRes?.modifiedCount ?? '?'} acknowledged=${jobRes?.acknowledged ?? '?'}`);
        }
        return updated;
    }
    async remove(viewer, commentId) {
        const comment = await this.requireComment(commentId);
        assertCanEditComment(viewer, comment);
        if (comment.isDeleted)
            return { ok: true };
        await this.commentModel
            .updateOne({ _id: comment._id }, {
            $set: {
                isDeleted: true,
                deletedAt: new Date(),
                content: '[deleted]',
            },
        })
            .exec();
        if (comment.moderationStatus === 'approved') {
            await this.decrementApprovedCommentTarget(comment);
        }
        return { ok: true };
    }
    async decrementApprovedCommentTarget(comment) {
        if (comment.postId) {
            await this.postModel
                .updateOne({ _id: comment.postId }, [
                {
                    $set: {
                        commentCount: {
                            $max: [0, { $subtract: ['$commentCount', 1] }],
                        },
                    },
                },
            ])
                .exec();
        }
        else if (comment.newsId) {
            await this.newsModel
                .updateOne({ _id: comment.newsId }, [
                {
                    $set: {
                        commentCount: {
                            $max: [0, { $subtract: ['$commentCount', 1] }],
                        },
                    },
                },
            ])
                .exec();
        }
    }
    async requireComment(commentId) {
        const comment = await this.commentModel.findById(commentId).exec();
        if (!comment)
            throw new common_1.NotFoundException('Comment not found');
        return comment;
    }
    async requirePost(postId) {
        const post = await this.postModel.findById(postId).exec();
        if (!post)
            throw new common_1.NotFoundException('Post not found');
        return post;
    }
    async requirePublishedNews(id) {
        const news = await this.newsModel.findById(id).exec();
        if (!news || news.status !== 'published')
            throw new common_1.NotFoundException('News not found');
        return news;
    }
};
exports.CommentsService = CommentsService;
exports.CommentsService = CommentsService = CommentsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(comment_model_1.CommentModelName)),
    __param(1, (0, mongoose_1.InjectModel)(post_model_1.PostModelName)),
    __param(2, (0, mongoose_1.InjectModel)(news_model_1.NewsModelName)),
    __param(4, (0, mongoose_1.InjectModel)(comment_moderation_job_model_1.CommentModerationJobModelName)),
    __metadata("design:paramtypes", [Function, Function, Function, notifications_service_1.NotificationsService, Function])
], CommentsService);
function assertCanEditComment(viewer, comment) {
    if (viewer.role === 'admin')
        return;
    if (comment.authorId === viewer.id)
        return;
    throw new common_1.ForbiddenException('Forbidden');
}
//# sourceMappingURL=comments.service.js.map