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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiStatsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const comment_model_1 = require("../models/comment.model");
const post_model_1 = require("../models/post.model");
const admin_alert_model_1 = require("../models/admin-alert.model");
const user_model_1 = require("../models/user.model");
let AiStatsService = class AiStatsService {
    commentModel;
    postModel;
    alertModel;
    userModel;
    constructor(commentModel, postModel, alertModel, userModel) {
        this.commentModel = commentModel;
        this.postModel = postModel;
        this.alertModel = alertModel;
        this.userModel = userModel;
    }
    async getDashboardOverview() {
        const now = Date.now();
        const since24h = new Date(now - 24 * 60 * 60_000);
        const since7d = new Date(now - 7 * 24 * 60 * 60_000);
        const [totalUsers, todayUsers, totalPosts, todayPosts, totalComments, todayComments, pendingReview, moderationQueue, postChart, commentChart] = await Promise.all([
            this.userModel.countDocuments().exec(),
            this.userModel.countDocuments({ createdAt: { $gte: since24h } }).exec(),
            this.postModel.countDocuments({ status: 'published' }).exec(),
            this.postModel.countDocuments({ status: 'published', createdAt: { $gte: since24h } }).exec(),
            this.commentModel.countDocuments({ isDeleted: { $ne: true } }).exec(),
            this.commentModel.countDocuments({ isDeleted: { $ne: true }, createdAt: { $gte: since24h } }).exec(),
            this.commentModel.countDocuments({ moderationStatus: 'under_review', isDeleted: { $ne: true } }).exec(),
            this.commentModel.countDocuments({ moderationStatus: 'pending', isDeleted: { $ne: true } }).exec(),
            this.postModel.aggregate([
                { $match: { status: 'published', createdAt: { $gte: since7d } } },
                { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
                { $sort: { _id: 1 } },
            ]).exec(),
            this.commentModel.aggregate([
                { $match: { isDeleted: { $ne: true }, createdAt: { $gte: since7d } } },
                { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
                { $sort: { _id: 1 } },
            ]).exec(),
        ]);
        const chartMap = new Map();
        for (const r of postChart)
            chartMap.set(r._id, { posts: Number(r.count), comments: 0 });
        for (const r of commentChart) {
            const entry = chartMap.get(r._id) ?? { posts: 0, comments: 0 };
            entry.comments = Number(r.count);
            chartMap.set(r._id, entry);
        }
        const activity7d = [...chartMap.entries()]
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([date, v]) => ({ date, posts: v.posts, comments: v.comments }));
        return {
            users: { total: totalUsers, today: todayUsers },
            posts: { total: totalPosts, today: todayPosts },
            comments: { total: totalComments, today: todayComments },
            moderation: { pendingReview, queue: moderationQueue },
            activity7d,
        };
    }
    async getModerationStats(days = 7) {
        const since = new Date(Date.now() - days * 24 * 60 * 60_000);
        const rows = await this.commentModel
            .aggregate([
            { $match: { createdAt: { $gte: since } } },
            {
                $group: {
                    _id: {
                        date: {
                            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
                        },
                        status: '$moderationStatus',
                    },
                    count: { $sum: 1 },
                },
            },
            { $sort: { '_id.date': 1 } },
        ])
            .exec();
        const byDate = {};
        for (const r of rows) {
            const date = r._id.date;
            const status = r._id.status ?? 'unknown';
            if (!byDate[date])
                byDate[date] = {};
            byDate[date][status] = Number(r.count);
        }
        return Object.entries(byDate)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([date, counts]) => ({ date, ...counts }));
    }
    async getSentiment4Distribution() {
        const rows = await this.commentModel
            .aggregate([
            { $match: { sentiment4: { $exists: true, $ne: null } } },
            { $group: { _id: '$sentiment4', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
        ])
            .exec();
        const total = rows.reduce((s, r) => s + Number(r.count), 0);
        return rows.map((r) => ({
            label: r._id,
            count: Number(r.count),
            ratio: total > 0 ? Math.round((Number(r.count) / total) * 10000) / 10000 : 0,
        }));
    }
    async getToxicRateByGame() {
        const rows = await this.commentModel
            .aggregate([
            {
                $match: {
                    'toxicity.isToxic': { $exists: true },
                    postId: { $exists: true, $ne: null },
                },
            },
            {
                $lookup: {
                    from: 'posts',
                    let: { pid: '$postId' },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $eq: ['$_id', { $toObjectId: '$$pid' }] },
                            },
                        },
                        { $project: { game: 1 } },
                    ],
                    as: 'post',
                },
            },
            { $unwind: { path: '$post', preserveNullAndEmptyArrays: false } },
            {
                $group: {
                    _id: '$post.game',
                    total: { $sum: 1 },
                    toxic: {
                        $sum: { $cond: ['$toxicity.isToxic', 1, 0] },
                    },
                },
            },
            {
                $addFields: {
                    toxicRate: {
                        $round: [{ $divide: ['$toxic', '$total'] }, 4],
                    },
                },
            },
            { $sort: { toxicRate: -1 } },
        ])
            .exec();
        return rows.map((r) => ({
            game: r._id ?? 'unknown',
            total: Number(r.total),
            toxic: Number(r.toxic),
            toxicRate: Number(r.toxicRate),
        }));
    }
    async getRecentAlerts(opts) {
        const limit = Math.min(100, Math.max(1, opts.limit));
        const filter = opts.unreadOnly ? { isRead: false } : {};
        const items = await this.alertModel
            .find(filter)
            .sort({ createdAt: -1 })
            .limit(limit)
            .lean()
            .exec();
        return items.map((a) => ({
            id: String(a._id),
            type: a.type,
            tag: a.tag,
            ratio3h: a.ratio3h,
            ratio24h: a.ratio24h,
            isRead: a.isRead,
            createdAt: a.createdAt,
        }));
    }
    async markAlertRead(alertId) {
        await this.alertModel
            .updateOne({ _id: alertId }, { $set: { isRead: true } })
            .exec();
        return { ok: true };
    }
    async getUnderReviewComments(opts) {
        const page = Math.max(1, opts.page);
        const limit = Math.min(50, Math.max(1, opts.limit));
        const skip = (page - 1) * limit;
        const filter = { moderationStatus: 'under_review', isDeleted: { $ne: true } };
        const [items, total] = await Promise.all([
            this.commentModel
                .find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean()
                .exec(),
            this.commentModel.countDocuments(filter).exec(),
        ]);
        return {
            items: items.map((c) => ({
                id: String(c._id),
                postId: c.postId,
                newsId: c.newsId,
                authorId: c.authorId,
                content: c.content,
                confidence: c.sentiment4Scores
                    ? Math.max(...Object.values(c.sentiment4Scores))
                    : undefined,
                sentiment4: c.sentiment4,
                intent: c.intent,
                toxicityScore: c.toxicity?.score,
                createdAt: c.createdAt,
            })),
            page,
            limit,
            total,
            hasMore: skip + items.length < total,
        };
    }
    async reviewComment(commentId, decision) {
        const result = await this.commentModel
            .updateOne({ _id: commentId, moderationStatus: 'under_review' }, { $set: { moderationStatus: decision } })
            .exec();
        return { ok: result.modifiedCount > 0 };
    }
};
exports.AiStatsService = AiStatsService;
exports.AiStatsService = AiStatsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(comment_model_1.CommentModelName)),
    __param(1, (0, mongoose_1.InjectModel)(post_model_1.PostModelName)),
    __param(2, (0, mongoose_1.InjectModel)(admin_alert_model_1.AdminAlertModelName)),
    __param(3, (0, mongoose_1.InjectModel)(user_model_1.UserModelName)),
    __metadata("design:paramtypes", [Function, Function, Function, Function])
], AiStatsService);
//# sourceMappingURL=ai-stats.service.js.map