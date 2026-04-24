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
exports.PostsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const post_model_1 = require("../models/post.model");
const follows_service_1 = require("./follows.service");
let PostsService = class PostsService {
    postModel;
    followsService;
    constructor(postModel, followsService) {
        this.postModel = postModel;
        this.followsService = followsService;
    }
    async create(author, dto) {
        const tags = normalizeTags(dto.tags);
        return this.postModel.create({
            authorId: author.id,
            title: dto.title.trim(),
            content: dto.content,
            thumbnailUrl: dto.thumbnailUrl?.trim(),
            game: dto.game.trim().toLowerCase(),
            tournament: dto.tournament?.trim(),
            tags,
            status: dto.status,
            viewCount: 0,
            commentCount: 0,
            likeCount: 0,
            isPinned: false,
        });
    }
    async update(author, postId, dto) {
        const post = await this.requirePost(postId);
        assertCanEditPost(author, post);
        const patch = {};
        if (dto.title !== undefined)
            patch.title = dto.title.trim();
        if (dto.content !== undefined)
            patch.content = dto.content;
        if (dto.thumbnailUrl !== undefined)
            patch.thumbnailUrl = dto.thumbnailUrl?.trim();
        if (dto.game !== undefined)
            patch.game = dto.game.trim().toLowerCase();
        if (dto.tournament !== undefined)
            patch.tournament = dto.tournament?.trim();
        if (dto.tags !== undefined)
            patch.tags = normalizeTags(dto.tags);
        if (dto.status !== undefined)
            patch.status = dto.status;
        const updated = await this.postModel
            .findByIdAndUpdate(post._id, { $set: patch }, { new: true })
            .exec();
        if (!updated)
            throw new common_1.NotFoundException('Post not found');
        return updated;
    }
    async remove(author, postId) {
        const post = await this.requirePost(postId);
        assertCanEditPost(author, post);
        await post.deleteOne();
        return { ok: true };
    }
    async getById(author, postId) {
        const post = await this.requirePost(postId);
        assertCanReadPost(author, post);
        await this.postModel.updateOne({ _id: post._id }, { $inc: { viewCount: 1 } }).exec();
        const refreshed = await this.postModel.findById(post._id).exec();
        if (!refreshed)
            throw new common_1.NotFoundException('Post not found');
        return refreshed;
    }
    async list(author, query) {
        const page = query.page;
        const limit = query.limit;
        const skip = (page - 1) * limit;
        if (query.tab === 'following') {
            if (!author)
                throw new common_1.ForbiddenException('Login required for following feed');
            const followeeIds = await this.followsService.listFolloweeIds(author.id);
            if (followeeIds.length === 0) {
                return { items: [], page, limit };
            }
            const filter = {
                status: 'published',
                authorId: { $in: followeeIds },
            };
            applyGameTagFilters(filter, query);
            const items = await this.postModel
                .find(filter)
                .sort({ isPinned: -1, pinnedAt: -1, createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .exec();
            return { items, page, limit };
        }
        const baseFilter = {};
        applyVisibility(baseFilter, author);
        applyGameTagFilters(baseFilter, query);
        if (query.tab === 'hot') {
            const pipeline = [
                { $match: baseFilter },
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
                { $sort: { isPinned: -1, pinnedAt: -1, hotScore: -1, createdAt: -1 } },
                { $skip: skip },
                { $limit: limit },
            ];
            const items = await this.postModel.aggregate(pipeline).exec();
            return { items, page, limit };
        }
        const items = await this.postModel
            .find(baseFilter)
            .sort({ isPinned: -1, pinnedAt: -1, createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .exec();
        return { items, page, limit };
    }
    async requirePost(postId) {
        const post = await this.postModel.findById(postId).exec();
        if (!post)
            throw new common_1.NotFoundException('Post not found');
        return post;
    }
};
exports.PostsService = PostsService;
exports.PostsService = PostsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(post_model_1.PostModelName)),
    __metadata("design:paramtypes", [Function, follows_service_1.FollowsService])
], PostsService);
function applyVisibility(filter, viewer) {
    if (!viewer) {
        filter['status'] = 'published';
        return;
    }
    filter['$or'] = [
        { status: 'published' },
        { status: 'draft', authorId: viewer.id },
        ...(viewer.role === 'admin' ? [{ status: 'draft' }] : []),
    ];
}
function assertCanReadPost(viewer, post) {
    if (post.status === 'published')
        return;
    if (!viewer)
        throw new common_1.ForbiddenException('Forbidden');
    if (viewer.role === 'admin')
        return;
    if (post.authorId === viewer.id)
        return;
    throw new common_1.ForbiddenException('Forbidden');
}
function assertCanEditPost(viewer, post) {
    if (viewer.role === 'admin')
        return;
    if (post.authorId === viewer.id)
        return;
    throw new common_1.ForbiddenException('Forbidden');
}
function normalizeTags(tags) {
    if (!tags)
        return [];
    const out = new Set();
    for (const t of tags) {
        const s = t.trim().toLowerCase();
        if (!s)
            continue;
        out.add(s.startsWith('#') ? s.slice(1) : s);
    }
    return [...out];
}
function applyGameTagFilters(filter, query) {
    const game = query.game?.trim().toLowerCase();
    const tag = query.tag?.trim().toLowerCase().replace(/^#/, '');
    if (!game && !tag)
        return;
    const extra = {};
    if (game)
        extra['game'] = game;
    if (tag)
        extra['tags'] = { $in: [tag] };
    const existingOr = filter['$or'];
    if (existingOr) {
        filter['$and'] = [...(filter['$and'] ?? []), { $or: existingOr }, extra];
        delete filter['$or'];
        return;
    }
    if (game)
        filter['game'] = game;
    if (tag)
        filter['tags'] = { $in: [tag] };
}
function recencyBoostExpr() {
    const now = Date.now();
    const windowMs = 48 * 60 * 60 * 1000;
    return {
        $let: {
            vars: {
                ageMs: {
                    $subtract: [
                        now,
                        { $toLong: { $toDate: '$createdAt' } },
                    ],
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
                                        $subtract: [
                                            1,
                                            { $divide: ['$$ageMs', windowMs] },
                                        ],
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
//# sourceMappingURL=posts.service.js.map