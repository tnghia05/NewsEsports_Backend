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
exports.HashtagsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const post_model_1 = require("../models/post.model");
const comment_model_1 = require("../models/comment.model");
const hashtag_event_model_1 = require("../models/hashtag-event.model");
const hot_topic_model_1 = require("../models/hot-topic.model");
const entity_trend_model_1 = require("../models/entity-trend.model");
let HashtagsService = class HashtagsService {
    postModel;
    commentModel;
    hashtagEventModel;
    hotTopicModel;
    entityTrendModel;
    constructor(postModel, commentModel, hashtagEventModel, hotTopicModel, entityTrendModel) {
        this.postModel = postModel;
        this.commentModel = commentModel;
        this.hashtagEventModel = hashtagEventModel;
        this.hotTopicModel = hotTopicModel;
        this.entityTrendModel = entityTrendModel;
    }
    async listPostsByTag(tag, opts) {
        const page = opts.page;
        const limit = opts.limit;
        const skip = (page - 1) * limit;
        const normalized = normalizeTag(tag);
        const baseMatch = { status: 'published', tags: { $in: [normalized] } };
        if (opts.tab === 'hot') {
            const pipeline = [
                { $match: baseMatch },
                {
                    $addFields: {
                        hotScore: {
                            $add: [
                                { $multiply: ['$likeCount', 3] },
                                { $multiply: ['$commentCount', 5] },
                                { $multiply: ['$viewCount', 1] },
                                recencyBoostExpr(),
                            ],
                        },
                    },
                },
                { $sort: { hotScore: -1, createdAt: -1 } },
                { $skip: skip },
                { $limit: limit },
            ];
            const items = await this.postModel.aggregate(pipeline).exec();
            return { items, page, limit };
        }
        const items = await this.postModel
            .find(baseMatch)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .exec();
        return { items, page, limit };
    }
    async trending(window) {
        const items = await this.hotTopicModel
            .find({ window })
            .sort({ hotness: -1 })
            .limit(30)
            .lean()
            .exec();
        return {
            window,
            items: items.map((r) => ({
                tag: r.tag,
                postCount: r.components?.discuss ?? 0,
                engagement: r.components?.read ?? 0,
                score: r.hotness,
                trend: r.trend ?? undefined,
            })),
        };
    }
    async createEvent(user, dto) {
        const tag = normalizeTag(dto.tag);
        if (!tag)
            return { ok: true };
        await this.hashtagEventModel.create({
            userId: user?.id,
            sessionId: dto.sessionId?.trim(),
            tag,
            action: 'view',
        });
        return { ok: true };
    }
    async getEntityTrends(opts) {
        const window = normalizeHotTopicWindow(opts.window);
        const limit = Math.min(50, Math.max(1, opts.limit));
        const filter = { window };
        if (opts.type)
            filter['entityType'] = String(opts.type).toUpperCase();
        const items = await this.entityTrendModel
            .find(filter)
            .sort({ mentionCount: -1 })
            .limit(limit)
            .lean()
            .exec();
        return {
            window,
            items: items.map((r, idx) => ({
                rank: idx + 1,
                entity: r.entity,
                type: r.entityType,
                mentionCount: r.mentionCount,
                sentiment: r.sentiment,
                toxicRate: r.toxicRate,
                intent: r.intent,
            })),
        };
    }
    async hotTopics(query) {
        const window = normalizeHotTopicWindow(query.window);
        const limit = Math.min(50, Math.max(1, Number(query.limit) || 10));
        const items = await this.hotTopicModel
            .find({ window })
            .sort({ hotness: -1 })
            .limit(limit)
            .lean()
            .exec();
        const updatedAt = items.length > 0
            ? new Date(Math.max(...items.map((r) => r?.updatedAt instanceof Date
                ? r.updatedAt.getTime()
                : new Date(r?.updatedAt ?? 0).getTime()))).toISOString()
            : undefined;
        return {
            window,
            updatedAt,
            items: items.map((r, idx) => ({
                rank: idx + 1,
                tag: r.tag,
                hotness: r.hotness,
                components: r.components,
                trend: r.trend ?? undefined,
            })),
        };
    }
};
exports.HashtagsService = HashtagsService;
exports.HashtagsService = HashtagsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(post_model_1.PostModelName)),
    __param(1, (0, mongoose_1.InjectModel)(comment_model_1.CommentModelName)),
    __param(2, (0, mongoose_1.InjectModel)(hashtag_event_model_1.HashtagEventModelName)),
    __param(3, (0, mongoose_1.InjectModel)(hot_topic_model_1.HotTopicModelName)),
    __param(4, (0, mongoose_1.InjectModel)(entity_trend_model_1.EntityTrendModelName)),
    __metadata("design:paramtypes", [Function, Function, Function, Function, Function])
], HashtagsService);
function normalizeTag(tag) {
    return tag.trim().toLowerCase().replace(/^#/, '');
}
function normalizeHotTopicWindow(w) {
    if (w === '7d')
        return '7d';
    if (w === '24h')
        return '24h';
    return '3h';
}
function recencyBoostExpr() {
    const now = Date.now();
    const windowMs = 48 * 60 * 60 * 1000;
    return {
        $let: {
            vars: {
                ageMs: {
                    $subtract: [now, { $toLong: { $toDate: '$createdAt' } }],
                },
            },
            in: {
                $cond: [
                    { $lte: ['$$ageMs', windowMs] },
                    {
                        $multiply: [
                            8,
                            {
                                $max: [
                                    0,
                                    {
                                        $subtract: [1, { $divide: ['$$ageMs', windowMs] }],
                                    },
                                ],
                            },
                        ],
                    },
                    0,
                ],
            },
        },
    };
}
//# sourceMappingURL=hashtags.service.js.map