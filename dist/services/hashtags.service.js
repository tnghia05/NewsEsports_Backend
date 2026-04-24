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
let HashtagsService = class HashtagsService {
    postModel;
    constructor(postModel) {
        this.postModel = postModel;
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
        const sinceMs = window === '7d' ? 7 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
        const since = new Date(Date.now() - sinceMs);
        const pipeline = [
            { $match: { status: 'published', createdAt: { $gte: since } } },
            { $unwind: '$tags' },
            {
                $addFields: {
                    engagement: {
                        $add: [
                            { $multiply: ['$likeCount', 3] },
                            { $multiply: ['$commentCount', 5] },
                            { $multiply: ['$viewCount', 1] },
                        ],
                    },
                },
            },
            {
                $group: {
                    _id: '$tags',
                    postCount: { $sum: 1 },
                    engagement: { $sum: '$engagement' },
                },
            },
            {
                $addFields: {
                    score: { $add: ['$postCount', '$engagement'] },
                },
            },
            { $sort: { score: -1 } },
            { $limit: 30 },
            {
                $project: {
                    _id: 0,
                    tag: '$_id',
                    postCount: 1,
                    engagement: 1,
                    score: 1,
                },
            },
        ];
        const items = await this.postModel.aggregate(pipeline).exec();
        return { window, items };
    }
};
exports.HashtagsService = HashtagsService;
exports.HashtagsService = HashtagsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(post_model_1.PostModelName)),
    __metadata("design:paramtypes", [Function])
], HashtagsService);
function normalizeTag(tag) {
    return tag.trim().toLowerCase().replace(/^#/, '');
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