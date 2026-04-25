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
const search_event_model_1 = require("../models/search-event.model");
const hot_keyword_model_1 = require("../models/hot-keyword.model");
let HotKeywordsWorkerService = HotKeywordsWorkerService_1 = class HotKeywordsWorkerService {
    config;
    searchEventModel;
    hotKeywordModel;
    logger = new common_1.Logger(HotKeywordsWorkerService_1.name);
    timer;
    running = false;
    intervalMs;
    constructor(config, searchEventModel, hotKeywordModel) {
        this.config = config;
        this.searchEventModel = searchEventModel;
        this.hotKeywordModel = hotKeywordModel;
        this.intervalMs = Number(this.config.get('HOT_KEYWORDS_INTERVAL_MS') ?? 60_000);
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
        const since = window === '7d' ? Date.now() - 7 * 24 * 60 * 60_000 : Date.now() - 24 * 60 * 60_000;
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
                    score: { $add: ['$searchCount', { $multiply: ['$clickCount', 3] }] },
                },
            },
            { $sort: { score: -1, lastAt: -1 } },
            { $limit: 200 },
        ])
            .exec();
        const bulk = this.hotKeywordModel.collection.initializeUnorderedBulkOp();
        const now = new Date();
        for (const r of rows) {
            const keyword = String(r._id);
            const score = Number(r.score) || 0;
            if (!keyword || score <= 0)
                continue;
            bulk
                .find({ window, keyword })
                .upsert()
                .updateOne({ $set: { score, updatedAt: now } });
        }
        if (bulk.length > 0)
            await bulk.execute();
        await this.hotKeywordModel
            .deleteMany({ window, updatedAt: { $lt: new Date(Date.now() - 30 * 24 * 60 * 60_000) } })
            .exec();
        const elapsed = Date.now() - started;
        this.logger.log(`recompute window=${window} rows=${rows.length} in ${elapsed}ms`);
    }
};
exports.HotKeywordsWorkerService = HotKeywordsWorkerService;
exports.HotKeywordsWorkerService = HotKeywordsWorkerService = HotKeywordsWorkerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, mongoose_1.InjectModel)(search_event_model_1.SearchEventModelName)),
    __param(2, (0, mongoose_1.InjectModel)(hot_keyword_model_1.HotKeywordModelName)),
    __metadata("design:paramtypes", [config_1.ConfigService, Function, Function])
], HotKeywordsWorkerService);
//# sourceMappingURL=hot-keywords-worker.service.js.map