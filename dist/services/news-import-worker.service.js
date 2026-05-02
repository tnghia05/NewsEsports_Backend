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
var NewsImportWorkerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NewsImportWorkerService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const mongoose_1 = require("@nestjs/mongoose");
const news_model_1 = require("../models/news.model");
const rss_service_1 = require("../infra/rss/rss.service");
const rss_sources_service_1 = require("./rss-sources.service");
let NewsImportWorkerService = NewsImportWorkerService_1 = class NewsImportWorkerService {
    config;
    newsModel;
    rssService;
    rssSourcesService;
    logger = new common_1.Logger(NewsImportWorkerService_1.name);
    timer;
    running = false;
    intervalMs;
    maxItemsPerFeed;
    constructor(config, newsModel, rssService, rssSourcesService) {
        this.config = config;
        this.newsModel = newsModel;
        this.rssService = rssService;
        this.rssSourcesService = rssSourcesService;
        this.intervalMs = Number(this.config.get('RSS_IMPORT_INTERVAL_MS') ?? 10 * 60_000);
        this.maxItemsPerFeed = Number(this.config.get('RSS_IMPORT_MAX_ITEMS') ?? 30);
    }
    onModuleInit() {
        this.timer = setInterval(() => void this.tick(), this.intervalMs);
        void this.tick();
    }
    onModuleDestroy() {
        if (this.timer)
            clearInterval(this.timer);
    }
    async importNow() {
        return this.runImport();
    }
    async tick() {
        if (this.running)
            return;
        this.running = true;
        try {
            await this.runImport();
        }
        finally {
            this.running = false;
        }
    }
    getSourcesFromEnv() {
        const raw = String(this.config.get('RSS_SOURCES') ?? '').trim();
        if (!raw)
            return [];
        return raw
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);
    }
    async getSources() {
        const fromDb = await this.rssSourcesService.listEnabledUrls();
        if (fromDb.length)
            return fromDb;
        return this.getSourcesFromEnv();
    }
    async runImport() {
        const sources = await this.getSources();
        if (!sources.length)
            return { ok: true, imported: 0, skipped: 0, sources: 0 };
        const started = Date.now();
        let imported = 0;
        let skipped = 0;
        for (const feedUrl of sources) {
            try {
                const items = (await this.rssService.fetchFeed(feedUrl)).slice(0, this.maxItemsPerFeed);
                for (const item of items) {
                    const externalId = (item.guid ?? item.link).trim();
                    const created = await this.tryCreateFromRss(feedUrl, item, externalId);
                    if (created)
                        imported++;
                    else
                        skipped++;
                }
                await this.rssSourcesService.markImportResult(feedUrl, { ok: true });
            }
            catch (e) {
                const err = String(e?.message ?? e);
                this.logger.warn(`RSS import failed feed=${feedUrl} err=${err}`);
                await this.rssSourcesService.markImportResult(feedUrl, {
                    ok: false,
                    error: err,
                });
            }
        }
        const elapsed = Date.now() - started;
        this.logger.log(`RSS import done in ${elapsed}ms sources=${sources.length} imported=${imported} skipped=${skipped}`);
        return { ok: true, imported, skipped, sources: sources.length };
    }
    async tryCreateFromRss(feedUrl, item, externalId) {
        const title = item.title.trim();
        const content = (item.content ?? '').trim() || title;
        const slug = makeRssSlug(title, externalId);
        try {
            const created = await this.newsModel.create({
                title,
                slug,
                excerpt: undefined,
                content,
                coverImageUrl: undefined,
                tags: [],
                status: 'published',
                publishedAt: item.publishedAt ?? new Date(),
                source: 'rss',
                sourceUrl: feedUrl,
                externalUrl: item.link,
                externalId,
            });
            try {
                await this.enrichFromExternalUrl(created._id, item.link, content);
            }
            catch (e) {
                this.logger.debug(`rss enrich skipped externalUrl=${item.link} err=${String(e?.message ?? e)}`);
            }
            return true;
        }
        catch (e) {
            const msg = String(e?.message ?? e).toLowerCase();
            if (msg.includes('duplicate key'))
                return false;
            this.logger.warn(`RSS item create failed feed=${feedUrl} externalId=${externalId} err=${String(e?.message ?? e)}`);
            return false;
        }
    }
    async enrichFromExternalUrl(newsId, externalUrl, currentContent) {
        let JSDOM;
        let Readability;
        try {
            ({ JSDOM } = await import('jsdom'));
            ({ Readability } = await import('@mozilla/readability'));
        }
        catch (e) {
            this.logger.warn(`rss enrich unavailable (jsdom/readability load failed): ${String(e?.message ?? e)}`);
            return;
        }
        const curLen = (currentContent ?? '').trim().length;
        if (curLen >= 2000)
            return;
        const timeoutMs = Number(this.config.get('RSS_SCRAPE_TIMEOUT_MS') ?? 12_000);
        const maxBytes = Number(this.config.get('RSS_SCRAPE_MAX_BYTES') ?? 1_500_000);
        const started = Date.now();
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), timeoutMs);
        let html = '';
        try {
            const res = await fetch(externalUrl, {
                signal: ctrl.signal,
                headers: {
                    'user-agent': 'Mozilla/5.0 (compatible; backend-rss-import/1.0; +https://backend)',
                    accept: 'text/html,application/xhtml+xml',
                },
            });
            if (!res.ok)
                return;
            html = await res.text();
        }
        finally {
            clearTimeout(t);
        }
        if (!html || html.length > maxBytes)
            return;
        const dom = new JSDOM(html, { url: externalUrl });
        const reader = new Readability(dom.window.document);
        const article = reader.parse();
        if (!article?.content)
            return;
        const extractedHtml = article.content.trim();
        const extractedText = (article.textContent ?? '').trim();
        if (extractedText.length < curLen)
            return;
        const excerpt = (article.excerpt ?? '').trim() ||
            (extractedText.length > 260 ? `${extractedText.slice(0, 260).trim()}…` : extractedText);
        const ogImage = dom.window.document
            .querySelector('meta[property=\"og:image\"], meta[name=\"og:image\"]')
            ?.getAttribute('content')
            ?.trim() || undefined;
        const firstImg = dom.window.document
            .querySelector('img')
            ?.getAttribute('src')
            ?.trim() || undefined;
        const coverImageUrl = ogImage ?? firstImg;
        await this.newsModel
            .updateOne({ _id: newsId }, {
            $set: {
                content: extractedHtml,
                excerpt,
                ...(coverImageUrl ? { coverImageUrl } : {}),
            },
        })
            .exec();
        this.logger.log(`rss enrich ok ms=${Date.now() - started} url=${externalUrl} chars=${extractedText.length}`);
    }
};
exports.NewsImportWorkerService = NewsImportWorkerService;
exports.NewsImportWorkerService = NewsImportWorkerService = NewsImportWorkerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, mongoose_1.InjectModel)(news_model_1.NewsModelName)),
    __metadata("design:paramtypes", [config_1.ConfigService, Function, rss_service_1.RssService,
        rss_sources_service_1.RssSourcesService])
], NewsImportWorkerService);
function makeRssSlug(title, externalId) {
    const base = slugify(title).slice(0, 80) || 'news';
    const suffix = shortHash(externalId);
    return `${base}-${suffix}`;
}
function slugify(input) {
    return input
        .trim()
        .toLowerCase()
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'd')
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9\-_.]/g, '')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
}
function shortHash(s) {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) {
        h ^= s.charCodeAt(i);
        h = Math.imul(h, 16777619);
    }
    return (h >>> 0).toString(16).slice(0, 8);
}
//# sourceMappingURL=news-import-worker.service.js.map