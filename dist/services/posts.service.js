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
var PostsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const post_model_1 = require("../models/post.model");
const user_model_1 = require("../models/user.model");
const post_like_model_1 = require("../models/post-like.model");
const post_save_model_1 = require("../models/post-save.model");
const comment_model_1 = require("../models/comment.model");
const post_comment_digest_model_1 = require("../models/post-comment-digest.model");
const follows_service_1 = require("./follows.service");
const points_service_1 = require("./points.service");
const assert_can_read_post_1 = require("../utils/assert-can-read-post");
let PostsService = PostsService_1 = class PostsService {
    postModel;
    userModel;
    postLikeModel;
    postSaveModel;
    commentModel;
    digestModel;
    followsService;
    pointsService;
    logger = new common_1.Logger(PostsService_1.name);
    constructor(postModel, userModel, postLikeModel, postSaveModel, commentModel, digestModel, followsService, pointsService) {
        this.postModel = postModel;
        this.userModel = userModel;
        this.postLikeModel = postLikeModel;
        this.postSaveModel = postSaveModel;
        this.commentModel = commentModel;
        this.digestModel = digestModel;
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
    async getCommentDigest(postId, geminiApiKey, force) {
        const newestComment = await this.commentModel
            .findOne({ postId, isDeleted: { $ne: true }, moderationStatus: 'approved' })
            .select({ createdAt: 1 })
            .sort({ createdAt: -1 })
            .lean()
            .exec();
        const currentCount = await this.commentModel.countDocuments({
            postId,
            isDeleted: { $ne: true },
            moderationStatus: 'approved',
        });
        if (currentCount === 0) {
            return { summary: null, aggregate: null, commentCount: 0, cached: false };
        }
        const newestAt = newestComment?.createdAt
            ? new Date(newestComment.createdAt)
            : null;
        const cached = await this.digestModel.findOne({ postId }).lean().exec();
        const cacheStillValid = !force &&
            cached &&
            cached.commentCount === currentCount &&
            newestAt &&
            cached.lastCommentAt &&
            new Date(cached.lastCommentAt).getTime() >= newestAt.getTime();
        if (cacheStillValid) {
            this.logger.debug(`[Digest] cache HIT postId=${postId} count=${currentCount}`);
            return {
                summary: cached.summary,
                aggregate: cached.aggregate,
                commentCount: cached.commentCount,
                cached: true,
            };
        }
        this.logger.log(`[Digest] cache MISS postId=${postId} count=${currentCount} — rebuilding`);
        const [post, comments] = await Promise.all([
            this.requirePost(postId),
            this.commentModel
                .find({ postId, isDeleted: { $ne: true }, moderationStatus: 'approved' })
                .select({
                content: 1,
                sentiment: 1,
                sentiment4: 1,
                intent: 1,
                aspects: 1,
                qualityScore: 1,
                toxicity: 1,
                createdAt: 1,
            })
                .sort({ createdAt: 1 })
                .limit(200)
                .lean()
                .exec(),
        ]);
        const aggregate = {
            commentCount: comments.length,
            sentiment: { positive: 0, neutral: 0, negative: 0 },
            sentiment4: { positive: 0, negative: 0, neutral: 0, toxic: 0 },
            intent: { praise: 0, complain: 0, question: 0, other: 0 },
            aspects: {},
            avgQualityScore: 0,
            avgToxicityScore: 0,
            toxicCount: 0,
        };
        let totalQuality = 0;
        let totalToxicity = 0;
        for (const c of comments) {
            if (c.sentiment)
                aggregate.sentiment[c.sentiment] =
                    (aggregate.sentiment[c.sentiment] || 0) + 1;
            if (c.sentiment4)
                aggregate.sentiment4[c.sentiment4] =
                    (aggregate.sentiment4[c.sentiment4] || 0) + 1;
            if (c.intent)
                aggregate.intent[c.intent] =
                    (aggregate.intent[c.intent] || 0) + 1;
            if (Array.isArray(c.aspects))
                for (const a of c.aspects)
                    aggregate.aspects[a] = (aggregate.aspects[a] || 0) + 1;
            totalQuality += typeof c.qualityScore === 'number' ? c.qualityScore : 0;
            const toxScore = c.toxicity?.score ?? 0;
            totalToxicity += toxScore;
            if (c.toxicity?.isToxic)
                aggregate.toxicCount++;
        }
        const n = comments.length;
        aggregate.avgQualityScore = totalQuality / n;
        aggregate.avgToxicityScore = totalToxicity / n;
        const needsNewSummary = !cached?.summary ||
            !cacheStillValid;
        let summary = cached?.summary ?? null;
        if (needsNewSummary) {
            if (!geminiApiKey) {
                this.logger.warn(`[Digest] GEMINI_API_KEY is missing! Skipping Gemini generation for postId=${postId}.`);
            }
            else {
                const pct = (v) => Math.round((v / n) * 100);
                const dominantSentiment = Object.entries(aggregate.sentiment4).sort((a, b) => b[1] - a[1])[0][0];
                const dominantIntent = Object.entries(aggregate.intent).sort((a, b) => b[1] - a[1])[0][0];
                const topAspects = Object.entries(aggregate.aspects).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k]) => k);
                const sampleTexts = comments
                    .filter((c) => (c.qualityScore ?? 0) > -0.3)
                    .sort((a, b) => (b.qualityScore ?? 0) - (a.qualityScore ?? 0))
                    .slice(0, 5)
                    .map((c) => String(c.content ?? '').slice(0, 120))
                    .filter(Boolean);
                try {
                    const { GoogleGenerativeAI } = await import('@google/generative-ai');
                    const genAI = new GoogleGenerativeAI(geminiApiKey);
                    const model = genAI.getGenerativeModel({ model: 'gemini-3.1-flash-lite' });
                    const prompt = `Bạn là một nhà báo/phóng viên Esports sắc sảo và am hiểu cộng đồng từ một trang tin thể thao điện tử hàng đầu Việt Nam. Dưới đây là thông tin bài viết cùng dữ liệu thống kê từ ${n} bình luận của cộng đồng game thủ:\n\n` +
                        `THÔNG TIN BÀI VIẾT:\n` +
                        `- Tiêu đề: ${post.title}\n` +
                        `- Nội dung bài viết (trích đoạn): ${post.content.slice(0, 500)}...\n\n` +
                        `DỮ LIỆU BÌNH LUẬN:\n` +
                        `- Cảm xúc chủ đạo: ${dominantSentiment} (tích cực: ${pct(aggregate.sentiment4.positive)}%, tiêu cực: ${pct(aggregate.sentiment4.negative)}%, độc hại: ${pct(aggregate.sentiment4.toxic)}%)\n` +
                        `- Chủ đề bình luận chính: ${dominantIntent} (khen ngợi: ${pct(aggregate.intent.praise)}%, phàn nàn: ${pct(aggregate.intent.complain)}%, hỏi đáp: ${pct(aggregate.intent.question)}%)\n` +
                        `- Khía cạnh được thảo luận nhiều: ${topAspects.join(', ') || 'chung'}\n` +
                        `- Điểm chất lượng trung bình: ${aggregate.avgQualityScore.toFixed(2)} (thang -1 đến +1)\n` +
                        `- Bình luận độc hại bị lọc: ${aggregate.toxicCount} / ${n}\n` +
                        `Một vài bình luận tiêu biểu của game thủ: ${sampleTexts.map((t) => `"${t}"`).join('; ')}\n\n` +
                        `Yêu cầu: Hãy đóng vai một nhà báo Esports, viết MỘT đoạn văn ngắn (50–90 từ) bằng tiếng Việt tóm tắt nhanh bức tranh dư luận và bầu không khí tranh luận của cộng đồng game thủ. Trọng tâm chính phải đặt ở phản ứng, góc nhìn và ý kiến của cộng đồng (dựa trên DỮ LIỆU BÌNH LUẬN), chỉ sử dụng thông tin bài viết ở trên làm bối cảnh nền chứ TUYỆT ĐỐI KHÔNG tóm tắt nội dung bài viết. ` +
                        `Văn phong phải đậm chất báo chí thể thao điện tử (sử dụng linh hoạt các thuật ngữ như meta, tuyển thủ, combat, phong độ, chiến thuật, lineup, cộng đồng fan, chảo lửa dư luận, v.v. khi phù hợp), lôi cuốn và sắc sảo. KHÔNG liệt kê số liệu khô khan, KHÔNG dùng markdown.`;
                    this.logger.log(`[Digest] Calling Gemini API (gemini-3.1-flash-lite) for postId=${postId}`);
                    const result = await model.generateContent(prompt);
                    summary = result.response.text().trim();
                    this.logger.log(`[Digest] Gemini generated summary successfully: "${summary}"`);
                }
                catch (e) {
                    this.logger.error(`[Digest] Gemini API call failed for postId=${postId}: ${String(e?.message ?? e)}`, e?.stack);
                    summary = cached?.summary ?? null;
                }
            }
        }
        await this.digestModel
            .findOneAndUpdate({ postId }, {
            $set: {
                summary,
                aggregate,
                commentCount: n,
                lastCommentAt: newestAt,
                generatedAt: needsNewSummary && summary ? new Date() : cached?.generatedAt,
            },
        }, { upsert: true, new: true })
            .exec();
        return { summary, aggregate, commentCount: n, cached: false };
    }
};
exports.PostsService = PostsService;
exports.PostsService = PostsService = PostsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(post_model_1.PostModelName)),
    __param(1, (0, mongoose_1.InjectModel)(user_model_1.UserModelName)),
    __param(2, (0, mongoose_1.InjectModel)(post_like_model_1.PostLikeModelName)),
    __param(3, (0, mongoose_1.InjectModel)(post_save_model_1.PostSaveModelName)),
    __param(4, (0, mongoose_1.InjectModel)(comment_model_1.CommentModelName)),
    __param(5, (0, mongoose_1.InjectModel)(post_comment_digest_model_1.PostCommentDigestModelName)),
    __metadata("design:paramtypes", [Function, Function, Function, Function, Function, Function, follows_service_1.FollowsService,
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