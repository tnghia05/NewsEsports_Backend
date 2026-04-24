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
let SearchService = class SearchService {
    postModel;
    userModel;
    constructor(postModel, userModel) {
        this.postModel = postModel;
        this.userModel = userModel;
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
};
exports.SearchService = SearchService;
exports.SearchService = SearchService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(post_model_1.PostModelName)),
    __param(1, (0, mongoose_1.InjectModel)(user_model_1.UserModelName)),
    __metadata("design:paramtypes", [Function, Function])
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
//# sourceMappingURL=search.service.js.map