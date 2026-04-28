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
exports.SearchService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const post_model_1 = require("../models/post.model");
const user_model_1 = require("../models/user.model");
const search_event_model_1 = require("../models/search-event.model");
const hot_keyword_model_1 = require("../models/hot-keyword.model");
let SearchService = class SearchService {
    postModel;
    userModel;
    searchEventModel;
    hotKeywordModel;
    constructor(postModel, userModel, searchEventModel, hotKeywordModel) {
        this.postModel = postModel;
        this.userModel = userModel;
        this.searchEventModel = searchEventModel;
        this.hotKeywordModel = hotKeywordModel;
    }
    async searchPosts(query) {
        const page = query.page;
        const limit = query.limit;
        const skip = (page - 1) * limit;
        const filter = { status: 'published' };
        const game = query.game?.trim().toLowerCase();
        const tag = query.tag?.trim().toLowerCase().replace(/^#/, '');
        if (game)
            filter.game = game;
        if (tag)
            filter.tags = { $in: [tag] };
        const q = query.q?.trim();
        if (q) {
            filter.$text = { $search: q };
        }
        if (query.tab === 'hot') {
            const pipeline = [
                { $match: filter },
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
            .find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .exec();
        return { items, page, limit };
    }
    async searchUsers(query) {
        const page = query.page;
        const limit = query.limit;
        const skip = (page - 1) * limit;
        const q = query.q.trim();
        const filter = { $text: { $search: q } };
        const items = await this.userModel
            .find(filter)
            .select({ displayName: 1, avatarUrl: 1 })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean()
            .exec();
        return {
            items: items.map((u) => ({
                id: String(u._id),
                displayName: u.displayName,
                avatarUrl: u.avatarUrl ?? undefined,
            })),
            page,
            limit,
        };
    }
    async createEvent(user, dto) {
        const q = normalizeKeyword(dto.q);
        if (!q)
            return { ok: true };
        await this.searchEventModel.create({
            userId: user?.id,
            sessionId: dto.sessionId?.trim(),
            q,
            action: dto.action,
            targetType: dto.targetType,
            targetId: dto.targetId?.trim(),
        });
        return { ok: true };
    }
    async getHotKeywords(opts) {
        const window = normalizeWindow(opts.window);
        const limit = Math.min(50, Math.max(1, Number(opts.limit) || 10));
        const items = await this.hotKeywordModel
            .find({ window })
            .sort({ score: -1 })
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
                keyword: r.keyword,
                score: r.score,
            })),
        };
    }
    async getTrends(opts) {
        const window = normalizeWindow(opts.window);
        const limit = Math.min(50, Math.max(1, Number(opts.limit) || 10));
        const items = await this.hotKeywordModel
            .find({ window })
            .sort({ score: -1 })
            .limit(limit)
            .lean()
            .exec();
        return {
            window,
            items: items.map((r) => ({
                keyword: r.keyword,
                score: r.score,
                trend: r.trend ?? undefined,
            })),
        };
    }
    async suggest(opts) {
        const limit = Math.min(20, Math.max(1, Number(opts.limit) || 10));
        const q = normalizeKeyword(opts.q);
        if (!q) {
            const hot = await this.hotKeywordModel
                .find({ window: '24h' })
                .sort({ score: -1 })
                .limit(limit)
                .lean()
                .exec();
            return { items: hot.map((r) => r.keyword) };
        }
        const rx = new RegExp(`^${escapeRegex(q)}`, 'i');
        const [hotMatches, recentMatches] = await Promise.all([
            this.hotKeywordModel
                .find({ window: '24h', keyword: { $regex: rx } })
                .sort({ score: -1 })
                .limit(limit)
                .lean()
                .exec(),
            this.searchEventModel
                .aggregate([
                { $match: { q: { $regex: rx } } },
                { $group: { _id: '$q', lastAt: { $max: '$createdAt' } } },
                { $sort: { lastAt: -1 } },
                { $limit: limit },
            ])
                .exec(),
        ]);
        const out = [];
        const seen = new Set();
        for (const r of hotMatches) {
            const k = String(r.keyword);
            if (!seen.has(k)) {
                seen.add(k);
                out.push(k);
            }
        }
        for (const r of recentMatches) {
            const k = String(r._id);
            if (!seen.has(k)) {
                seen.add(k);
                out.push(k);
            }
        }
        return { items: out.slice(0, limit) };
    }
};
exports.SearchService = SearchService;
exports.SearchService = SearchService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(post_model_1.PostModelName)),
    __param(1, (0, mongoose_1.InjectModel)(user_model_1.UserModelName)),
    __param(2, (0, mongoose_1.InjectModel)(search_event_model_1.SearchEventModelName)),
    __param(3, (0, mongoose_1.InjectModel)(hot_keyword_model_1.HotKeywordModelName)),
    __metadata("design:paramtypes", [Function, Function, Function, Function])
], SearchService);
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
function normalizeKeyword(input) {
    return input.trim().toLowerCase().replace(/\s+/g, ' ').slice(0, 200);
}
function normalizeWindow(w) {
    return w === '7d' ? '7d' : '24h';
}
function escapeRegex(input) {
    return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
//# sourceMappingURL=search.service.js.map