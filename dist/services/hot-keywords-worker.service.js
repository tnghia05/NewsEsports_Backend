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
var HotKeywordsWorkerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.HotKeywordsWorkerService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const mongoose_1 = require("@nestjs/mongoose");
const ai_service_1 = require("../infra/ai/ai.service");
const search_event_model_1 = require("../models/search-event.model");
const hot_keyword_model_1 = require("../models/hot-keyword.model");
const post_model_1 = require("../models/post.model");
const comment_model_1 = require("../models/comment.model");
const news_model_1 = require("../models/news.model");
let HotKeywordsWorkerService = HotKeywordsWorkerService_1 = class HotKeywordsWorkerService {
    config;
    aiService;
    searchEventModel;
    hotKeywordModel;
    postModel;
    commentModel;
    newsModel;
    logger = new common_1.Logger(HotKeywordsWorkerService_1.name);
    timer;
    running = false;
    intervalMs;
    trendTopN;
    trendSampleN;
    constructor(config, aiService, searchEventModel, hotKeywordModel, postModel, commentModel, newsModel) {
        this.config = config;
        this.aiService = aiService;
        this.searchEventModel = searchEventModel;
        this.hotKeywordModel = hotKeywordModel;
        this.postModel = postModel;
        this.commentModel = commentModel;
        this.newsModel = newsModel;
        this.intervalMs = Number(this.config.get('HOT_KEYWORDS_INTERVAL_MS') ?? 60_000);
        this.trendTopN = Number(this.config.get('HOT_KEYWORDS_TREND_TOP_N') ?? 20);
        this.trendSampleN = Number(this.config.get('HOT_KEYWORDS_TREND_SAMPLE_N') ?? 20);
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
        const since = window === '7d'
            ? Date.now() - 7 * 24 * 60 * 60_000
            : Date.now() - 24 * 60 * 60_000;
        const sinceDate = new Date(since);
        const started = Date.now();
        const rows = await this.searchEventModel
            .aggregate([
            { $match: { createdAt: { $gte: sinceDate } } },
            {
                $group: {
                    _id: '$q',
                    searchCount: {
                        $sum: { $cond: [{ $eq: ['$action', 'search'] }, 1, 0] },
                    },
                    clickCount: {
                        $sum: { $cond: [{ $eq: ['$action', 'click'] }, 1, 0] },
                    },
                    lastAt: { $max: '$createdAt' },
                },
            },
            {
                $addFields: {
                    score: {
                        $add: ['$searchCount', { $multiply: ['$clickCount', 3] }],
                    },
                },
            },
            { $sort: { score: -1, lastAt: -1 } },
            { $limit: 200 },
        ])
            .exec();
        const bulk = this.hotKeywordModel.collection.initializeUnorderedBulkOp();
        const now = new Date();
        const topN = Math.min(Math.max(0, this.trendTopN), 50);
        const topKeywords = [];
        for (const r of rows) {
            const keyword = String(r._id);
            const score = Number(r.score) || 0;
            if (!keyword || score <= 0)
                continue;
            if (topKeywords.length < topN)
                topKeywords.push(keyword);
            bulk
                .find({ window, keyword })
                .upsert()
                .updateOne({ $set: { score, updatedAt: now } });
        }
        if (bulk.length > 0)
            await bulk.execute();
        if (topKeywords.length) {
            const trendStarted = Date.now();
            for (const keyword of topKeywords) {
                const trend = await this.computeTrendForKeyword(keyword, sinceDate);
                if (!trend)
                    continue;
                await this.hotKeywordModel
                    .updateOne({ window, keyword }, { $set: { trend, updatedAt: now } })
                    .exec();
            }
            this.logger.log(`trend window=${window} top=${topKeywords.length} sampleN=${this.trendSampleN} in ${Date.now() - trendStarted}ms`);
        }
        await this.hotKeywordModel
            .deleteMany({
            window,
            updatedAt: { $lt: new Date(Date.now() - 30 * 24 * 60 * 60_000) },
        })
            .exec();
        const elapsed = Date.now() - started;
        this.logger.log(`recompute window=${window} rows=${rows.length} in ${elapsed}ms`);
    }
    async computeTrendForKeyword(keyword, sinceDate) {
        const sampleN = Math.min(50, Math.max(1, Number(this.trendSampleN) || 20));
        const clickEvents = await this.searchEventModel
            .find({
            q: keyword,
            action: 'click',
            createdAt: { $gte: sinceDate },
            targetId: { $exists: true, $ne: null },
        })
            .sort({ createdAt: -1 })
            .limit(sampleN * 2)
            .lean()
            .exec();
        if (!clickEvents.length) {
            return {
                sampleCount: 0,
                labeledCount: 0,
                toxicCount: 0,
                sentiment4: {},
                intent: {},
                aspect: {},
            };
        }
        const byType = {};
        for (const ev of clickEvents) {
            const t = String(ev?.targetType ?? '').toLowerCase();
            const id = typeof ev?.targetId === 'string' ? ev.targetId : null;
            if (!id || !['post', 'comment', 'news'].includes(t))
                continue;
            (byType[t] ??= []).push(id);
        }
        const textById = new Map();
        const [postDocs, commentDocs, newsDocs] = await Promise.all([
            byType['post']?.length
                ? this.postModel
                    .find({ _id: { $in: byType['post'] } })
                    .select({ title: 1, content: 1 })
                    .lean()
                    .exec()
                : [],
            byType['comment']?.length
                ? this.commentModel
                    .find({ _id: { $in: byType['comment'] } })
                    .select({ content: 1 })
                    .lean()
                    .exec()
                : [],
            byType['news']?.length
                ? this.newsModel
                    .find({ _id: { $in: byType['news'] } })
                    .select({ title: 1, content: 1 })
                    .lean()
                    .exec()
                : [],
        ]);
        for (const doc of postDocs) {
            const t = makeText(`${doc.title ?? ''}\n${doc.content ?? ''}`);
            if (t)
                textById.set(String(doc._id), t);
        }
        for (const doc of commentDocs) {
            const t = makeText(doc.content ?? '');
            if (t)
                textById.set(String(doc._id), t);
        }
        for (const doc of newsDocs) {
            const t = makeText(`${doc.title ?? ''}\n${doc.content ?? ''}`);
            if (t)
                textById.set(String(doc._id), t);
        }
        const texts = [];
        for (const ev of clickEvents) {
            if (texts.length >= sampleN)
                break;
            const id = typeof ev?.targetId === 'string' ? ev.targetId : null;
            if (id && textById.has(id))
                texts.push(textById.get(id));
        }
        const AI_CONCURRENCY = 5;
        const results = [];
        for (let i = 0; i < texts.length; i += AI_CONCURRENCY) {
            const batch = texts.slice(i, i + AI_CONCURRENCY);
            const settled = await Promise.allSettled(batch.map((t) => this.aiService.analyzeComment(t)));
            for (const s of settled) {
                if (s.status === 'fulfilled')
                    results.push(s.value);
            }
        }
        const trend = {
            sampleCount: texts.length,
            labeledCount: 0,
            toxicCount: 0,
            sentiment4: {},
            intent: {},
            aspect: {},
        };
        const sentiment4Sum = {};
        const intentSum = {};
        const aspectSum = {};
        let scoredCount = 0;
        for (const r of results) {
            trend.labeledCount += 1;
            if (r.sentiment4)
                trend.sentiment4[r.sentiment4] =
                    (trend.sentiment4[r.sentiment4] ?? 0) + 1;
            if (r.intent)
                trend.intent[r.intent] = (trend.intent[r.intent] ?? 0) + 1;
            for (const a of r.aspects ?? [])
                trend.aspect[a] = (trend.aspect[a] ?? 0) + 1;
            if (r.sentiment4 === 'toxic' || r.toxicity.isToxic)
                trend.toxicCount += 1;
            const hasScores = r.sentiment4Scores || r.intentScores || r.aspectScores;
            if (hasScores)
                scoredCount += 1;
            if (r.sentiment4Scores) {
                for (const [k, v] of Object.entries(r.sentiment4Scores)) {
                    sentiment4Sum[k] = (sentiment4Sum[k] ?? 0) + (v ?? 0);
                }
            }
            if (r.intentScores) {
                for (const [k, v] of Object.entries(r.intentScores)) {
                    intentSum[k] = (intentSum[k] ?? 0) + (v ?? 0);
                }
            }
            if (r.aspectScores) {
                for (const [k, v] of Object.entries(r.aspectScores)) {
                    aspectSum[k] = (aspectSum[k] ?? 0) + (v ?? 0);
                }
            }
        }
        if (scoredCount > 0) {
            trend.sentiment4Avg = divideMap(sentiment4Sum, scoredCount);
            trend.intentAvg = divideMap(intentSum, scoredCount);
            trend.aspectAvg = divideMap(aspectSum, scoredCount);
        }
        return trend;
    }
};
exports.HotKeywordsWorkerService = HotKeywordsWorkerService;
exports.HotKeywordsWorkerService = HotKeywordsWorkerService = HotKeywordsWorkerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, mongoose_1.InjectModel)(search_event_model_1.SearchEventModelName)),
    __param(3, (0, mongoose_1.InjectModel)(hot_keyword_model_1.HotKeywordModelName)),
    __param(4, (0, mongoose_1.InjectModel)(post_model_1.PostModelName)),
    __param(5, (0, mongoose_1.InjectModel)(comment_model_1.CommentModelName)),
    __param(6, (0, mongoose_1.InjectModel)(news_model_1.NewsModelName)),
    __metadata("design:paramtypes", [config_1.ConfigService,
        ai_service_1.AiService, Function, Function, Function, Function, Function])
], HotKeywordsWorkerService);
function makeText(input) {
    return String(input).trim().replace(/\s+/g, ' ').slice(0, 800);
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
//# sourceMappingURL=hot-keywords-worker.service.js.map