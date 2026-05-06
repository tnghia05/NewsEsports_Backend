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
var HotTopicsWorkerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.HotTopicsWorkerService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const mongoose_1 = require("@nestjs/mongoose");
const ai_service_1 = require("../infra/ai/ai.service");
const post_model_1 = require("../models/post.model");
const comment_model_1 = require("../models/comment.model");
const hashtag_event_model_1 = require("../models/hashtag-event.model");
const hot_topic_model_1 = require("../models/hot-topic.model");
let HotTopicsWorkerService = HotTopicsWorkerService_1 = class HotTopicsWorkerService {
    config;
    aiService;
    postModel;
    commentModel;
    hashtagEventModel;
    hotTopicModel;
    logger = new common_1.Logger(HotTopicsWorkerService_1.name);
    timer;
    running = false;
    intervalMs;
    topN;
    sampleN;
    trendCooldownMs;
    constructor(config, aiService, postModel, commentModel, hashtagEventModel, hotTopicModel) {
        this.config = config;
        this.aiService = aiService;
        this.postModel = postModel;
        this.commentModel = commentModel;
        this.hashtagEventModel = hashtagEventModel;
        this.hotTopicModel = hotTopicModel;
        this.intervalMs = Number(this.config.get('HOT_TOPICS_INTERVAL_MS') ?? 60_000);
        this.topN = Number(this.config.get('HOT_TOPICS_TOP_N') ?? 30);
        this.sampleN = Number(this.config.get('HOT_TOPICS_SAMPLE_N') ?? 20);
        this.trendCooldownMs = Number(this.config.get('HOT_TOPICS_TREND_COOLDOWN_MS') ?? 10 * 60_000);
    }
    onModuleInit() {
        this.timer = setInterval(() => void this.tick(), this.intervalMs);
        void this.tick();
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
            await this.recompute('3h');
            await this.recompute('24h');
            await this.recompute('7d');
        }
        catch (e) {
            this.logger.warn(`recompute failed: ${String(e?.message ?? e)}`);
        }
        finally {
            this.running = false;
        }
    }
    async recompute(window) {
        const wMs = windowMs(window);
        const sinceDate = new Date(Date.now() - wMs);
        const recentCutoff = new Date(Date.now() - wMs / 3);
        const started = Date.now();
        const rows = await this.postModel
            .aggregate([
            { $match: { status: 'published', createdAt: { $gte: sinceDate } } },
            { $unwind: '$tags' },
            {
                $group: {
                    _id: '$tags',
                    postCount: { $sum: 1 },
                    recentPostCount: {
                        $sum: { $cond: [{ $gte: ['$createdAt', recentCutoff] }, 1, 0] },
                    },
                    originalUsers: { $addToSet: '$authorId' },
                    postIds: { $addToSet: '$_id' },
                },
            },
            {
                $project: {
                    tag: '$_id',
                    _id: 0,
                    postCount: 1,
                    recentPostCount: 1,
                    originalUsers: 1,
                    postIds: 1,
                },
            },
            { $sort: { postCount: -1 } },
            { $limit: 200 },
        ])
            .exec();
        const tagList = rows.map((r) => String(r.tag)).filter(Boolean);
        if (!tagList.length) {
            await this.hotTopicModel.deleteMany({ window }).exec();
            this.logger.log(`recompute window=${window} empty in ${Date.now() - started}ms`);
            return;
        }
        const tagToPostIds = new Map();
        const tagPostAuthors = new Map();
        const tagRecentPosts = new Map();
        const allPostIds = [];
        for (const r of rows) {
            const tag = String(r.tag);
            const ids = (r.postIds ?? []).map(String);
            tagToPostIds.set(tag, ids);
            tagPostAuthors.set(tag, new Set((r.originalUsers ?? []).map(String)));
            tagRecentPosts.set(tag, Number(r.recentPostCount) || 0);
            allPostIds.push(...ids);
        }
        const uniquePostIds = [...new Set(allPostIds)];
        const commentsByPost = uniquePostIds.length > 0
            ? await this.commentModel
                .aggregate([
                {
                    $match: {
                        createdAt: { $gte: sinceDate },
                        postId: { $in: uniquePostIds },
                    },
                },
                {
                    $group: {
                        _id: '$postId',
                        count: { $sum: 1 },
                        recentCount: {
                            $sum: {
                                $cond: [{ $gte: ['$createdAt', recentCutoff] }, 1, 0],
                            },
                        },
                        authors: { $addToSet: '$authorId' },
                    },
                },
            ])
                .exec()
            : [];
        const postCommentStats = new Map();
        for (const r of commentsByPost) {
            postCommentStats.set(String(r._id), {
                count: Number(r.count) || 0,
                recentCount: Number(r.recentCount) || 0,
                authors: (r.authors ?? []).map(String),
            });
        }
        const commentMap = new Map();
        const recentCommentMap = new Map();
        const mergedUsersMap = new Map();
        for (const [tag, pids] of tagToPostIds) {
            let totalComments = 0;
            let recentComments = 0;
            const allAuthors = new Set(tagPostAuthors.get(tag) ?? []);
            for (const pid of pids) {
                const stats = postCommentStats.get(pid);
                if (stats) {
                    totalComments += stats.count;
                    recentComments += stats.recentCount;
                    for (const a of stats.authors)
                        allAuthors.add(a);
                }
            }
            commentMap.set(tag, totalComments);
            recentCommentMap.set(tag, recentComments);
            mergedUsersMap.set(tag, allAuthors.size);
        }
        const readRows = await this.hashtagEventModel
            .aggregate([
            {
                $match: {
                    createdAt: { $gte: sinceDate },
                    action: 'view',
                    tag: { $in: tagList },
                },
            },
            {
                $project: {
                    tag: 1,
                    viewer: {
                        $ifNull: [
                            '$userId',
                            { $concat: ['sess:', { $ifNull: ['$sessionId', ''] }] },
                        ],
                    },
                },
            },
            { $match: { viewer: { $ne: 'sess:' } } },
            { $group: { _id: { tag: '$tag', viewer: '$viewer' } } },
            { $group: { _id: '$_id.tag', read: { $sum: 1 } } },
        ])
            .exec();
        const readMap = new Map();
        for (const r of readRows) {
            readMap.set(String(r._id), Number(r.read) || 0);
        }
        const now = new Date();
        const bulk = this.hotTopicModel.collection.initializeUnorderedBulkOp();
        const scored = [];
        for (const r of rows) {
            const tag = String(r.tag);
            const postCount = Number(r.postCount) || 0;
            const originalUsers = mergedUsersMap.get(tag) ?? 0;
            const commentCount = commentMap.get(tag) ?? 0;
            const read = readMap.get(tag) ?? 0;
            const discuss = postCount + commentCount;
            const readScore = Math.log1p(read);
            const discussScore = Math.log1p(discuss);
            const originalScore = Math.log1p(originalUsers);
            const raw = 0.3 * readScore + 0.3 * discussScore + 0.4 * originalScore;
            const recentPosts = tagRecentPosts.get(tag) ?? 0;
            const recentComments = recentCommentMap.get(tag) ?? 0;
            const totalActivity = postCount + commentCount;
            const recentActivity = recentPosts + recentComments;
            const recencyRatio = totalActivity > 0 ? recentActivity / totalActivity : 0;
            const recencyBoost = 1 + 0.5 * recencyRatio;
            const hotness = clamp01((raw * recencyBoost) / 4.5) * 10;
            scored.push({
                tag,
                hotness,
                components: { read, discuss, originalUsers },
            });
        }
        scored.sort((a, b) => b.hotness - a.hotness);
        const topN = scored.slice(0, Math.min(Math.max(1, this.topN), 50));
        for (const s of topN) {
            bulk
                .find({ window, tag: s.tag })
                .upsert()
                .updateOne({
                $set: {
                    hotness: round2(s.hotness),
                    components: s.components,
                    updatedAt: now,
                },
            });
        }
        if (bulk.length > 0)
            await bulk.execute();
        const TREND_CONCURRENCY = 5;
        for (let i = 0; i < topN.length; i += TREND_CONCURRENCY) {
            const batch = topN.slice(i, i + TREND_CONCURRENCY);
            await Promise.allSettled(batch.map(async (s) => {
                try {
                    const existing = await this.hotTopicModel
                        .findOne({ window, tag: s.tag })
                        .select({ trendUpdatedAt: 1 })
                        .lean()
                        .exec();
                    const lastTrendAt = existing?.trendUpdatedAt
                        ? new Date(existing.trendUpdatedAt).getTime()
                        : 0;
                    if (lastTrendAt && Date.now() - lastTrendAt < this.trendCooldownMs) {
                        return;
                    }
                    const trend = await this.computeTrendForTag(s.tag, sinceDate);
                    if (!trend)
                        return;
                    await this.hotTopicModel
                        .updateOne({ window, tag: s.tag }, { $set: { trend, trendUpdatedAt: now, updatedAt: now } })
                        .exec();
                }
                catch (e) {
                    this.logger.warn(`trend ${s.tag}: ${String(e?.message ?? e)}`);
                }
            }));
        }
        await this.hotTopicModel
            .deleteMany({ window, updatedAt: { $lt: new Date(Date.now() - wMs) } })
            .exec();
        this.logger.log(`recompute window=${window} top=${topN.length} in ${Date.now() - started}ms`);
    }
    async computeTrendForTag(tag, sinceDate) {
        const sampleN = Math.min(50, Math.max(1, Number(this.sampleN) || 20));
        const posts = await this.postModel
            .find({
            status: 'published',
            tags: { $in: [tag] },
            createdAt: { $gte: sinceDate },
        })
            .sort({ createdAt: -1 })
            .limit(200)
            .select({ _id: 1, title: 1, content: 1 })
            .lean()
            .exec();
        const postIds = posts.map((p) => String(p._id));
        const comments = postIds.length > 0
            ? await this.commentModel
                .find({ postId: { $in: postIds }, createdAt: { $gte: sinceDate } })
                .sort({ createdAt: -1 })
                .limit(sampleN)
                .select({
                content: 1,
                sentiment4: 1,
                intent: 1,
                aspects: 1,
                sentiment4Scores: 1,
                intentScores: 1,
                aspectScores: 1,
                toxicity: 1,
            })
                .lean()
                .exec()
            : [];
        if (comments.length === 0 && posts.length === 0)
            return null;
        const labeledComments = [];
        const unlabeledTexts = [];
        for (const c of comments) {
            if (c.sentiment4) {
                labeledComments.push(c);
            }
            else {
                const t = makeText(c.content ?? '');
                if (t.length > 0)
                    unlabeledTexts.push(t);
            }
        }
        const totalFromComments = labeledComments.length + unlabeledTexts.length;
        const postTexts = [];
        if (totalFromComments < sampleN) {
            for (const p of posts) {
                if (totalFromComments + postTexts.length >= sampleN)
                    break;
                const t = makeText(`${p.title ?? ''}\n${p.content ?? ''}`);
                if (t.length > 0)
                    postTexts.push(t);
            }
        }
        const textsToAnalyze = [...unlabeledTexts, ...postTexts];
        const aiResults = [];
        if (textsToAnalyze.length > 0) {
            const AI_CONCURRENCY = 5;
            for (let i = 0; i < textsToAnalyze.length; i += AI_CONCURRENCY) {
                const batch = textsToAnalyze.slice(i, i + AI_CONCURRENCY);
                const settled = await Promise.allSettled(batch.map((t) => this.aiService.analyzeComment(t)));
                for (const s of settled) {
                    if (s.status === 'fulfilled')
                        aiResults.push(s.value);
                }
            }
        }
        const totalSamples = labeledComments.length + textsToAnalyze.length;
        if (totalSamples === 0)
            return null;
        const trend = {
            sampleCount: totalSamples,
            labeledCount: 0,
            toxicCount: 0,
            sentiment4: {},
            intent: {},
            aspect: {},
        };
        const acc = {
            sentiment4Sum: {},
            intentSum: {},
            aspectSum: {},
            scoredCount: 0,
        };
        for (const r of [...labeledComments, ...aiResults]) {
            accumulateResult(trend, acc, r);
        }
        if (acc.scoredCount > 0) {
            trend.sentiment4Avg = divideMap(acc.sentiment4Sum, acc.scoredCount);
            trend.intentAvg = divideMap(acc.intentSum, acc.scoredCount);
            trend.aspectAvg = divideMap(acc.aspectSum, acc.scoredCount);
        }
        return trend;
    }
};
exports.HotTopicsWorkerService = HotTopicsWorkerService;
exports.HotTopicsWorkerService = HotTopicsWorkerService = HotTopicsWorkerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, mongoose_1.InjectModel)(post_model_1.PostModelName)),
    __param(3, (0, mongoose_1.InjectModel)(comment_model_1.CommentModelName)),
    __param(4, (0, mongoose_1.InjectModel)(hashtag_event_model_1.HashtagEventModelName)),
    __param(5, (0, mongoose_1.InjectModel)(hot_topic_model_1.HotTopicModelName)),
    __metadata("design:paramtypes", [config_1.ConfigService,
        ai_service_1.AiService, Function, Function, Function, Function])
], HotTopicsWorkerService);
function accumulateResult(trend, acc, r) {
    trend.labeledCount += 1;
    if (r.sentiment4)
        trend.sentiment4[r.sentiment4] = (trend.sentiment4[r.sentiment4] ?? 0) + 1;
    if (r.intent)
        trend.intent[r.intent] = (trend.intent[r.intent] ?? 0) + 1;
    for (const a of r.aspects ?? [])
        trend.aspect[a] = (trend.aspect[a] ?? 0) + 1;
    if (r.sentiment4 === 'toxic' || r.toxicity?.isToxic)
        trend.toxicCount += 1;
    const hasScores = r.sentiment4Scores || r.intentScores || r.aspectScores;
    if (hasScores)
        acc.scoredCount += 1;
    for (const [k, v] of Object.entries((r.sentiment4Scores ?? {})))
        acc.sentiment4Sum[k] = (acc.sentiment4Sum[k] ?? 0) + (v ?? 0);
    for (const [k, v] of Object.entries((r.intentScores ?? {})))
        acc.intentSum[k] = (acc.intentSum[k] ?? 0) + (v ?? 0);
    for (const [k, v] of Object.entries((r.aspectScores ?? {})))
        acc.aspectSum[k] = (acc.aspectSum[k] ?? 0) + (v ?? 0);
}
function windowMs(w) {
    if (w === '7d')
        return 7 * 24 * 60 * 60_000;
    if (w === '24h')
        return 24 * 60 * 60_000;
    return 3 * 60 * 60_000;
}
function makeText(input) {
    return String(input).trim().replace(/\s+/g, ' ').slice(0, 800);
}
function clamp01(x) {
    if (Number.isNaN(x))
        return 0;
    return Math.max(0, Math.min(1, x));
}
function round2(x) {
    return Math.round(x * 100) / 100;
}
function round4(x) {
    return Math.round(x * 10000) / 10000;
}
function divideMap(sum, n) {
    const out = {};
    for (const [k, v] of Object.entries(sum)) {
        out[k] = round4(v / n);
    }
    return out;
}
//# sourceMappingURL=hot-topics-worker.service.js.map