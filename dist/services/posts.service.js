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
const user_model_1 = require("../models/user.model");
const post_like_model_1 = require("../models/post-like.model");
const post_save_model_1 = require("../models/post-save.model");
const comment_model_1 = require("../models/comment.model");
const follows_service_1 = require("./follows.service");
const points_service_1 = require("./points.service");
const assert_can_read_post_1 = require("../utils/assert-can-read-post");
let PostsService = class PostsService {
    postModel;
    userModel;
    postLikeModel;
    postSaveModel;
    commentModel;
    followsService;
    pointsService;
    constructor(postModel, userModel, postLikeModel, postSaveModel, commentModel, followsService, pointsService) {
        this.postModel = postModel;
        this.userModel = userModel;
        this.postLikeModel = postLikeModel;
        this.postSaveModel = postSaveModel;
        this.commentModel = commentModel;
        this.followsService = followsService;
        this.pointsService = pointsService;
    }
    async attachAuthors(items) {
        const authorIds = Array.from(new Set(items.map((p) => String(p.authorId ?? '')).filter(Boolean)));
        if (authorIds.length === 0)
            return items;
        const users = await this.userModel
            .find({ _id: { $in: authorIds } })
            .select({ displayName: 1, avatarUrl: 1 })
            .lean()
            .exec();
        const byId = new Map(users.map((u) => [
            String(u._id),
            { id: String(u._id), displayName: u.displayName, avatarUrl: u.avatarUrl },
        ]));
        return items.map((p) => ({
            ...(typeof p.toObject === 'function' ? p.toObject() : p),
            author: byId.get(String(p.authorId)) ?? { id: String(p.authorId) },
        }));
    }
    async create(author, dto) {
        const tags = normalizeTags(dto.tags);
        const post = await this.postModel.create({
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
        if (dto.status === 'published') {
            this.pointsService
                .addPoints(author.id, 20, 'post_publish', { postId: String(post._id) })
                .catch(() => { });
        }
        return post;
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
            .findByIdAndUpdate(post._id, { $set: patch }, { returnDocument: 'after' })
            .exec();
        if (!updated)
            throw new common_1.NotFoundException('Post not found');
        return updated;
    }
    async remove(author, postId) {
        const post = await this.requirePost(postId);
        assertCanEditPost(author, post);
        const pid = String(post._id);
        await Promise.all([
            this.commentModel.deleteMany({ postId: pid }).exec(),
            this.postLikeModel.deleteMany({ postId: pid }).exec(),
            this.postSaveModel.deleteMany({ postId: pid }).exec(),
        ]);
        await post.deleteOne();
        return { ok: true };
    }
    async getById(author, postId) {
        const post = await this.requirePost(postId);
        (0, assert_can_read_post_1.assertCanReadPost)(author, post);
        const isAuthor = author && post.authorId === author.id;
        const refreshed = isAuthor
            ? post
            : ((await this.postModel
                .findByIdAndUpdate(post._id, { $inc: { viewCount: 1 } }, { returnDocument: 'after' })
                .exec()) ?? post);
        if (!author) {
            const [withAuthor] = await this.attachAuthors([refreshed]);
            return withAuthor;
        }
        const pid = String(refreshed._id);
        const [liked, saved] = await Promise.all([
            this.postLikeModel.exists({ postId: pid, userId: author.id }),
            this.postSaveModel.exists({ postId: pid, userId: author.id }),
        ]);
        const obj = typeof refreshed.toObject === 'function'
            ? refreshed.toObject()
            : refreshed;
        const [withAuthor] = await this.attachAuthors([obj]);
        return Object.assign(withAuthor, {
            likedByMe: Boolean(liked),
            savedByMe: Boolean(saved),
        });
    }
    async list(author, query) {
        const page = query.page;
        const limit = query.limit;
        const skip = (page - 1) * limit;
        if (query.tab === 'saved') {
            if (!author)
                throw new common_1.ForbiddenException('Login required for saved feed');
            const saves = await this.postSaveModel
                .find({ userId: author.id })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean()
                .exec();
            const total = await this.postSaveModel
                .countDocuments({ userId: author.id })
                .exec();
            const postIds = saves.map((s) => s.postId);
            if (postIds.length === 0) {
                return { items: [], page, limit, total, hasMore: false };
            }
            const baseFilter = { _id: { $in: postIds } };
            applyVisibility(baseFilter, author);
            applyGameTagFilters(baseFilter, query);
            const posts = await this.postModel.find(baseFilter).exec();
            const byId = new Map(posts.map((p) => [String(p._id), p]));
            const items = postIds
                .map((id) => byId.get(String(id)))
                .filter(Boolean);
            const likedIds = new Set((await this.postLikeModel
                .find({ userId: author.id, postId: { $in: postIds } })
                .select({ postId: 1 })
                .lean()
                .exec()).map((r) => r.postId));
            const out = items.map((p) => ({
                ...p.toObject(),
                likedByMe: likedIds.has(String(p._id)),
                savedByMe: true,
            }));
            const outWithAuthors = await this.attachAuthors(out);
            return {
                items: outWithAuthors,
                page,
                limit,
                total,
                hasMore: skip + outWithAuthors.length < total,
            };
        }
        if (query.tab === 'following') {
            if (!author)
                throw new common_1.ForbiddenException('Login required for following feed');
            const followeeIds = await this.followsService.listFolloweeIds(author.id);
            if (followeeIds.length === 0) {
                return { items: [], page, limit, total: 0, hasMore: false };
            }
            const filter = {
                status: 'published',
                authorId: { $in: followeeIds },
            };
            applyGameTagFilters(filter, query);
            const [items, total] = await Promise.all([
                this.postModel
                    .find(filter)
                    .sort({ isPinned: -1, pinnedAt: -1, createdAt: -1 })
                    .skip(skip)
                    .limit(limit)
                    .exec(),
                this.postModel.countDocuments(filter).exec(),
            ]);
            const res = await attachLikeSaveFlags(this.postLikeModel, this.postSaveModel, author, items, page, limit, total, skip);
            res.items = await this.attachAuthors(res.items);
            return res;
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
            const [rawItems, total] = await Promise.all([
                this.postModel.aggregate(pipeline).exec(),
                this.postModel.countDocuments(baseFilter).exec(),
            ]);
            const res = await attachLikeSaveFlags(this.postLikeModel, this.postSaveModel, author, rawItems, page, limit, total, skip);
            res.items = await this.attachAuthors(res.items);
            return res;
        }
        const [items, total] = await Promise.all([
            this.postModel
                .find(baseFilter)
                .sort({ isPinned: -1, pinnedAt: -1, createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .exec(),
            this.postModel.countDocuments(baseFilter).exec(),
        ]);
        const res = await attachLikeSaveFlags(this.postLikeModel, this.postSaveModel, author, items, page, limit, total, skip);
        res.items = await this.attachAuthors(res.items);
        return res;
    }
    async listByUser(viewer, userId, query) {
        const page = query.page;
        const limit = query.limit;
        const skip = (page - 1) * limit;
        const filter = { authorId: userId };
        if (!viewer) {
            filter.status = 'published';
        }
        else if (viewer.role === 'admin') {
            if (query.status && query.status !== 'all')
                filter.status = query.status;
        }
        else if (viewer.id === userId) {
            if (query.status && query.status !== 'all')
                filter.status = query.status;
        }
        else {
            filter.status = 'published';
        }
        const game = query.game?.trim().toLowerCase();
        const tag = query.tag?.trim().toLowerCase().replace(/^#/, '');
        if (game)
            filter.game = game;
        if (tag)
            filter.tags = { $in: [tag] };
        const [items, total] = await Promise.all([
            this.postModel
                .find(filter)
                .sort({ isPinned: -1, pinnedAt: -1, createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .exec(),
            this.postModel.countDocuments(filter).exec(),
        ]);
        const res = await attachLikeSaveFlags(this.postLikeModel, this.postSaveModel, viewer, items, page, limit, total, skip);
        res.items = await this.attachAuthors(res.items);
        return res;
    }
    async listLikes(postId, opts) {
        const post = await this.requirePost(postId);
        if (post.status !== 'published') {
            throw new common_1.ForbiddenException('Forbidden');
        }
        const page = Math.max(1, Number(opts.page) || 1);
        const limit = Math.min(100, Math.max(1, Number(opts.limit) || 20));
        const skip = (page - 1) * limit;
        const filter = { postId: String(post._id) };
        const total = await this.postLikeModel.countDocuments(filter).exec();
        const rows = await this.postLikeModel
            .find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean()
            .exec();
        return {
            items: rows.map((r) => ({
                userId: r.userId,
                createdAt: r.createdAt,
            })),
            page,
            limit,
            total,
            hasMore: skip + rows.length < total,
        };
    }
    async pin(postId) {
        const updated = await this.postModel
            .findByIdAndUpdate(postId, { $set: { isPinned: true, pinnedAt: new Date() } }, { returnDocument: 'after' })
            .exec();
        if (!updated)
            throw new common_1.NotFoundException('Post not found');
        return updated;
    }
    async unpin(postId) {
        const updated = await this.postModel
            .findByIdAndUpdate(postId, { $set: { isPinned: false }, $unset: { pinnedAt: 1 } }, { returnDocument: 'after' })
            .exec();
        if (!updated)
            throw new common_1.NotFoundException('Post not found');
        return updated;
    }
    async getUserStats(userId) {
        const [postCount, commentCount, savedCount, posts, comments] = await Promise.all([
            this.postModel.countDocuments({ authorId: userId }).exec(),
            this.commentModel.countDocuments({ authorId: userId, isDeleted: { $ne: true } }).exec(),
            this.postSaveModel.countDocuments({ userId }).exec(),
            this.postModel.find({ authorId: userId }).select({ likeCount: 1 }).lean().exec(),
            this.commentModel.find({ authorId: userId, isDeleted: { $ne: true } }).select({ likeCount: 1 }).lean().exec(),
        ]);
        const postLikes = posts.reduce((sum, p) => sum + (p.likeCount || 0), 0);
        const commentLikes = comments.reduce((sum, c) => sum + (c.likeCount || 0), 0);
        return {
            postCount,
            commentCount,
            likeCount: postLikes + commentLikes,
            savedCount,
        };
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
    __param(1, (0, mongoose_1.InjectModel)(user_model_1.UserModelName)),
    __param(2, (0, mongoose_1.InjectModel)(post_like_model_1.PostLikeModelName)),
    __param(3, (0, mongoose_1.InjectModel)(post_save_model_1.PostSaveModelName)),
    __param(4, (0, mongoose_1.InjectModel)(comment_model_1.CommentModelName)),
    __metadata("design:paramtypes", [Function, Function, Function, Function, Function, follows_service_1.FollowsService,
        points_service_1.PointsService])
], PostsService);
async function attachLikeSaveFlags(postLikeModel, postSaveModel, viewer, items, page, limit, total, skip) {
    const hasMore = total != null && skip != null ? skip + items.length < total : undefined;
    if (!viewer)
        return { items, page, limit, ...(total != null ? { total, hasMore } : {}) };
    const ids = items.map((p) => String(p._id));
    if (ids.length === 0)
        return { items, page, limit, ...(total != null ? { total, hasMore } : {}) };
    const [likes, saves] = await Promise.all([
        postLikeModel
            .find({ userId: viewer.id, postId: { $in: ids } })
            .select({ postId: 1 })
            .lean()
            .exec(),
        postSaveModel
            .find({ userId: viewer.id, postId: { $in: ids } })
            .select({ postId: 1 })
            .lean()
            .exec(),
    ]);
    const liked = new Set(likes.map((r) => r.postId));
    const saved = new Set(saves.map((r) => r.postId));
    const out = items.map((p) => ({
        ...(typeof p.toObject === 'function' ? p.toObject() : p),
        likedByMe: liked.has(String(p._id)),
        savedByMe: saved.has(String(p._id)),
    }));
    return {
        items: out,
        page,
        limit,
        ...(total != null ? { total, hasMore } : {}),
    };
}
function applyVisibility(filter, viewer) {
    if (!viewer) {
        filter['status'] = 'published';
        return;
    }
    filter['$or'] = [
        { status: 'published' },
        { status: 'draft', authorId: viewer.id },
        ...(viewer.role === 'admin'
            ? [{ status: 'draft' }]
            : []),
    ];
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
//# sourceMappingURL=posts.service.js.map