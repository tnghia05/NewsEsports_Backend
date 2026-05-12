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
const admin_alert_model_1 = require("../models/admin-alert.model");
const entity_trend_model_1 = require("../models/entity-trend.model");
const post_model_1 = require("../models/post.model");
const comment_model_1 = require("../models/comment.model");
const hashtag_event_model_1 = require("../models/hashtag-event.model");
const hot_topic_model_1 = require("../models/hot-topic.model");
const post_like_model_1 = require("../models/post-like.model");
const hot_keyword_model_1 = require("../models/hot-keyword.model");
let HotTopicsWorkerService = HotTopicsWorkerService_1 = class HotTopicsWorkerService {
    config;
    aiService;
    postModel;
    commentModel;
    hashtagEventModel;
    hotTopicModel;
    adminAlertModel;
    entityTrendModel;
    postLikeModel;
    hotKeywordModel;
    logger = new common_1.Logger(HotTopicsWorkerService_1.name);
    timer;
    running = false;
    lastManualTriggerAt = 0;
    MANUAL_DEBOUNCE_MS = 30_000;
    intervalMs;
    topN;
    sampleN;
    trendCooldownMs;
    constructor(config, aiService, postModel, commentModel, hashtagEventModel, hotTopicModel, adminAlertModel, entityTrendModel, postLikeModel, hotKeywordModel) {
        this.config = config;
        this.aiService = aiService;
        this.postModel = postModel;
        this.commentModel = commentModel;
        this.hashtagEventModel = hashtagEventModel;
        this.hotTopicModel = hotTopicModel;
        this.adminAlertModel = adminAlertModel;
        this.entityTrendModel = entityTrendModel;
        this.postLikeModel = postLikeModel;
        this.hotKeywordModel = hotKeywordModel;
        this.intervalMs = Number(this.config.get('HOT_TOPICS_INTERVAL_MS') ?? 300_000);
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
    async triggerRecompute() {
        const now = Date.now();
        const remaining = this.MANUAL_DEBOUNCE_MS - (now - this.lastManualTriggerAt);
        if (remaining > 0) {
            this.logger.log(`[manual-refresh] debounced — ${Math.ceil(remaining / 1000)}s remaining`);
            return {
                triggered: false,
                message: `Vui lòng chờ ${Math.ceil(remaining / 1000)}s trước khi làm mới lại.`,
            };
        }
        if (this.running) {
            this.logger.log('[manual-refresh] already running, skipped');
            return { triggered: false, message: 'Đang recompute, vui lòng chờ.' };
        }
        this.lastManualTriggerAt = now;
        this.logger.log('[manual-refresh] triggered by user — starting recompute');
        this.tick().catch((e) => this.logger.error(`[manual-refresh] tick error: ${String(e?.message ?? e)}`));
        return { triggered: true, message: 'Đã kích hoạt recompute.' };
    }
    async tick() {
        if (this.running)
            return;
        this.running = true;
        const t0 = Date.now();
        this.logger.log('[tick] start recompute — 3h / 24h / 7d');
        try {
            await this.recompute('3h');
            this.logger.log('[tick] 3h done');
            await this.recompute('24h');
            this.logger.log('[tick] 24h done');
            await this.recompute('7d');
            this.logger.log('[tick] 7d done');
            await this.detectToxicitySpikes();
            this.logger.log('[tick] toxicity spikes checked');
            await this.recomputeEntityTrends('3h');
            await this.recomputeEntityTrends('24h');
            await this.recomputeEntityTrends('7d');
            this.logger.log(`[tick] entity trends done — total ${Date.now() - t0}ms`);
        }
        catch (e) {
            this.logger.warn(`[tick] failed: ${String(e?.message ?? e)}`);
        }
        finally {
            this.running = false;
        }
    }
    async recomputeEntityTrends(window) {
        const since = new Date(Date.now() - windowMs(window));
        const now = new Date();
        const rows = await this.commentModel
            .aggregate([
            {
                $match: {
                    createdAt: { $gte: since },
                    aiEntities: { $exists: true, $not: { $size: 0 } },
                },
            },
            { $unwind: '$aiEntities' },
            {
                $group: {
                    _id: { entity: '$aiEntities.text', type: '$aiEntities.type' },
                    mentionCount: { $sum: 1 },
                    positiveCount: {
                        $sum: { $cond: [{ $eq: ['$sentiment4', 'positive'] }, 1, 0] },
                    },
                    negativeCount: {
                        $sum: { $cond: [{ $eq: ['$sentiment4', 'negative'] }, 1, 0] },
                    },
                    neutralCount: {
                        $sum: { $cond: [{ $eq: ['$sentiment4', 'neutral'] }, 1, 0] },
                    },
                    toxicCount: {
                        $sum: { $cond: [{ $eq: ['$sentiment4', 'toxic'] }, 1, 0] },
                    },
                    praiseCount: {
                        $sum: { $cond: [{ $eq: ['$intent', 'praise'] }, 1, 0] },
                    },
                    complainCount: {
                        $sum: { $cond: [{ $eq: ['$intent', 'complain'] }, 1, 0] },
                    },
                    questionCount: {
                        $sum: { $cond: [{ $eq: ['$intent', 'question'] }, 1, 0] },
                    },
                    otherCount: {
                        $sum: { $cond: [{ $eq: ['$intent', 'other'] }, 1, 0] },
                    },
                },
            },
            { $sort: { mentionCount: -1 } },
            { $limit: 100 },
        ])
            .exec();
        if (!rows.length)
            return;
        const bulk = this.entityTrendModel.collection.initializeUnorderedBulkOp();
        for (const r of rows) {
            const total = Number(r.mentionCount) || 1;
            bulk
                .find({ entity: r._id.entity, entityType: r._id.type, window })
                .upsert()
                .updateOne({
                $set: {
                    mentionCount: total,
                    sentiment: {
                        positive: Number(r.positiveCount),
                        negative: Number(r.negativeCount),
                        neutral: Number(r.neutralCount),
                        toxic: Number(r.toxicCount),
                    },
                    toxicRate: round4(Number(r.toxicCount) / total),
                    intent: {
                        praise: Number(r.praiseCount),
                        complain: Number(r.complainCount),
                        question: Number(r.questionCount),
                        other: Number(r.otherCount),
                    },
                    updatedAt: now,
                },
            });
        }
        if (bulk.length > 0)
            await bulk.execute();
        await this.entityTrendModel
            .deleteMany({
            window,
            updatedAt: { $lt: new Date(Date.now() - windowMs(window)) },
        })
            .exec();
        this.logger.log(`entityTrends window=${window} entities=${rows.length}`);
    }
    async detectToxicitySpikes() {
        const [topics3h, topics24h] = await Promise.all([
            this.hotTopicModel
                .find({ window: '3h', 'trend.sampleCount': { $gt: 0 } })
                .select({ tag: 1, trend: 1 })
                .lean()
                .exec(),
            this.hotTopicModel
                .find({ window: '24h', 'trend.sampleCount': { $gt: 0 } })
                .select({ tag: 1, trend: 1 })
                .lean()
                .exec(),
        ]);
        const ratio24hMap = new Map();
        for (const t of topics24h) {
            const trend = t.trend;
            if (trend?.sampleCount > 0) {
                ratio24hMap.set(String(t.tag), (trend.toxicCount ?? 0) / trend.sampleCount);
            }
        }
        const MIN_SAMPLES = 5;
        const SPIKE_MULTIPLIER = 2;
        for (const t of topics3h) {
            const trend = t.trend;
            if (!trend || trend.sampleCount < MIN_SAMPLES)
                continue;
            const ratio3h = (trend.toxicCount ?? 0) / trend.sampleCount;
            const ratio24h = ratio24hMap.get(String(t.tag)) ?? 0;
            if (ratio3h > SPIKE_MULTIPLIER * ratio24h && ratio3h > 0.1) {
                await this.adminAlertModel
                    .findOneAndUpdate({
                    type: 'toxicity_spike',
                    tag: String(t.tag),
                    createdAt: { $gte: new Date(Date.now() - 60 * 60_000) },
                }, {
                    $setOnInsert: {
                        type: 'toxicity_spike',
                        tag: String(t.tag),
                        ratio3h: Math.round(ratio3h * 1000) / 1000,
                        ratio24h: Math.round(ratio24h * 1000) / 1000,
                        isRead: false,
                    },
                }, { upsert: true })
                    .exec();
                this.logger.warn(`toxicity_spike tag=${t.tag} ratio3h=${ratio3h.toFixed(3)} ratio24h=${ratio24h.toFixed(3)}`);
            }
        }
    }
    async recompute(window) {
        const wMs = windowMs(window);
        const sinceDate = new Date(Date.now() - wMs);
        const recentCutoff = new Date(Date.now() - wMs / 3);
        const started = Date.now();
        const prevDocs = await this.hotTopicModel
            .find({ window })
            .select({ tag: 1, hotness: 1 })
            .lean()
            .exec();
        const prevHotnessMap = new Map();
        for (const d of prevDocs)
            prevHotnessMap.set(String(d.tag), Number(d.hotness) || 0);
        const commentPostIds = await this.commentModel
            .distinct('postId', { createdAt: { $gte: sinceDate } })
            .exec();
        const rows = await this.postModel
            .aggregate([
            {
                $match: {
                    status: 'published',
                    $or: [
                        { createdAt: { $gte: sinceDate } },
                        ...(commentPostIds.length > 0
                            ? [{ _id: { $in: commentPostIds } }]
                            : []),
                    ],
                },
            },
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
        this.logger.log(`recompute window=${window} found ${rows.length} tagged posts — tags=[${tagList.slice(0, 5).join(', ')}${tagList.length > 5 ? ', ...' : ''}]`);
        if (!tagList.length) {
            await this.hotTopicModel.deleteMany({ window }).exec();
            this.logger.log(`recompute window=${window} empty (no published posts with tags in last ${window}) in ${Date.now() - started}ms`);
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
        const likeRows = uniquePostIds.length > 0
            ? await this.postLikeModel
                .aggregate([
                { $match: { postId: { $in: uniquePostIds }, createdAt: { $gte: sinceDate } } },
                { $group: { _id: '$postId', count: { $sum: 1 } } },
            ])
                .exec()
            : [];
        const postLikeMap = new Map();
        for (const r of likeRows)
            postLikeMap.set(String(r._id), Number(r.count) || 0);
        const tagLikeMap = new Map();
        for (const [tag, pids] of tagToPostIds) {
            tagLikeMap.set(tag, pids.reduce((s, pid) => s + (postLikeMap.get(pid) ?? 0), 0));
        }
        const kwWindow = window === '7d' ? '7d' : '24h';
        const kwDocs = tagList.length > 0
            ? await this.hotKeywordModel
                .find({ window: kwWindow, keyword: { $in: tagList } })
                .select({ keyword: 1, score: 1 })
                .lean()
                .exec()
            : [];
        const searchMap = new Map();
        for (const kw of kwDocs)
            searchMap.set(String(kw.keyword), Number(kw.score) || 0);
        const now = new Date();
        const bulk = this.hotTopicModel.collection.initializeUnorderedBulkOp();
        const scored = [];
        for (const r of rows) {
            const tag = String(r.tag);
            const postCount = Number(r.postCount) || 0;
            const originalUsers = mergedUsersMap.get(tag) ?? 0;
            const commentCount = commentMap.get(tag) ?? 0;
            const read = readMap.get(tag) ?? 0;
            const likes = tagLikeMap.get(tag) ?? 0;
            const searchVolume = searchMap.get(tag) ?? 0;
            if (originalUsers < 2)
                continue;
            const discuss = postCount + commentCount;
            const readScore = Math.log1p(read);
            const discussScore = Math.log1p(discuss);
            const originalScore = Math.log1p(originalUsers);
            const likeScore = Math.log1p(likes);
            const searchScore = Math.log1p(searchVolume);
            const raw = 0.20 * readScore +
                0.20 * discussScore +
                0.25 * originalScore +
                0.15 * likeScore +
                0.20 * searchScore;
            const recentPosts = tagRecentPosts.get(tag) ?? 0;
            const recentComments = recentCommentMap.get(tag) ?? 0;
            const totalActivity = postCount + commentCount;
            const recentActivity = recentPosts + recentComments;
            const recencyRatio = totalActivity > 0 ? recentActivity / totalActivity : 0;
            const decayFactor = 0.4 + 1.2 * recencyRatio;
            const baseHotness = clamp01((raw * decayFactor) / 4.5) * 10;
            const prevH = prevHotnessMap.get(tag) ?? 0;
            const velocity = prevH > 0 ? baseHotness / (prevH + 0.1) : 1.0;
            const velocityBoost = 0.85 + 0.15 * clamp01(Math.log1p(velocity) / Math.log1p(3));
            const hotness = clamp01((baseHotness * velocityBoost) / 10) * 10;
            scored.push({
                tag,
                hotness,
                components: { read, discuss, originalUsers, likes, searchVolume, velocityScore: round2(velocity) },
            });
        }
        scored.sort((a, b) => b.hotness - a.hotness);
        const topN = scored.slice(0, Math.min(Math.max(1, this.topN), 50));
        this.logger.log(`recompute window=${window} scored top3=[${topN.slice(0, 3).map((s) => `${s.tag}:${s.hotness.toFixed(2)}`).join(', ')}]`);
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
    __param(6, (0, mongoose_1.InjectModel)(admin_alert_model_1.AdminAlertModelName)),
    __param(7, (0, mongoose_1.InjectModel)(entity_trend_model_1.EntityTrendModelName)),
    __param(8, (0, mongoose_1.InjectModel)(post_like_model_1.PostLikeModelName)),
    __param(9, (0, mongoose_1.InjectModel)(hot_keyword_model_1.HotKeywordModelName)),
    __metadata("design:paramtypes", [config_1.ConfigService,
        ai_service_1.AiService, Function, Function, Function, Function, Function, Function, Function, Function])
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