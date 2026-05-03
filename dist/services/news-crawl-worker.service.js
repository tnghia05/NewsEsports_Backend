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
var NewsCrawlWorkerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NewsCrawlWorkerService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const mongoose_1 = require("@nestjs/mongoose");
const cheerio_1 = require("cheerio");
const news_model_1 = require("../models/news.model");
const crawl_sources_service_1 = require("./crawl-sources.service");
let NewsCrawlWorkerService = NewsCrawlWorkerService_1 = class NewsCrawlWorkerService {
    config;
    newsModel;
    crawlSourcesService;
    logger = new common_1.Logger(NewsCrawlWorkerService_1.name);
    timer;
    running = false;
    intervalMs;
    maxLinksPerSource;
    constructor(config, newsModel, crawlSourcesService) {
        this.config = config;
        this.newsModel = newsModel;
        this.crawlSourcesService = crawlSourcesService;
        this.intervalMs = Number(this.config.get('CRAWL_IMPORT_INTERVAL_MS') ?? 15 * 60_000);
        this.maxLinksPerSource = Number(this.config.get('CRAWL_IMPORT_MAX_LINKS') ?? 30);
    }
    onModuleInit() {
        this.timer = setInterval(() => void this.tick(), this.intervalMs);
        void this.tick();
    }
    onModuleDestroy() {
        if (this.timer)
            clearInterval(this.timer);
    }
    async crawlNow() {
        return this.runCrawl();
    }
    async tick() {
        if (this.running)
            return;
        this.running = true;
        try {
            await this.runCrawl();
        }
        finally {
            this.running = false;
        }
    }
    async runCrawl() {
        const sources = await this.crawlSourcesService.listEnabledUrls();
        if (!sources.length)
            return { ok: true, sources: 0, imported: 0, skipped: 0 };
        const started = Date.now();
        let imported = 0;
        let skipped = 0;
        for (const listingUrl of sources) {
            try {
                const links = await this.fetchListingLinks(listingUrl);
                for (const link of links.slice(0, this.maxLinksPerSource)) {
                    const created = await this.tryCreateFromCrawl(listingUrl, link);
                    if (created)
                        imported++;
                    else
                        skipped++;
                }
                await this.crawlSourcesService.markCrawlResult(listingUrl, { ok: true });
            }
            catch (e) {
                const err = String(e?.message ?? e);
                this.logger.warn(`crawl failed listing=${listingUrl} err=${err}`);
                await this.crawlSourcesService.markCrawlResult(listingUrl, {
                    ok: false,
                    error: err,
                });
            }
        }
        const elapsed = Date.now() - started;
        this.logger.log(`crawl done in ${elapsed}ms sources=${sources.length} imported=${imported} skipped=${skipped}`);
        return { ok: true, sources: sources.length, imported, skipped };
    }
    async fetchListingLinks(listingUrl) {
        const started = Date.now();
        const res = await fetch(listingUrl, {
            headers: {
                'user-agent': 'Mozilla/5.0 (compatible; backend-news-crawler/1.0; +https://backend)',
                accept: 'text/html,application/xhtml+xml',
            },
        });
        if (!res.ok)
            throw new Error(`listing HTTP ${res.status}`);
        const html = await res.text();
        this.logger.debug(`crawl listing ok ms=${Date.now() - started} url=${listingUrl} bytes=${html.length}`);
        const $ = (0, cheerio_1.load)(html);
        const out = new Set();
        $('a[href]').each((_, el) => {
            const href = String($(el).attr('href') ?? '').trim();
            if (!href)
                return;
            const abs = toAbsUrl(listingUrl, href);
            if (!abs)
                return;
            if (abs.includes('#') || abs.includes('/tag/') || abs.includes('/tags/'))
                return;
            if (abs.endsWith('.jpg') || abs.endsWith('.png') || abs.endsWith('.webp'))
                return;
            out.add(abs);
        });
        const host = safeHost(listingUrl);
        const arr = [...out].filter((u) => (host ? safeHost(u) === host : true));
        return arr;
    }
    async tryCreateFromCrawl(listingUrl, externalUrl) {
        const externalId = shortHash(externalUrl);
        const slug = `crawl-${externalId}`;
        try {
            const created = await this.newsModel.create({
                title: externalUrl,
                slug,
                excerpt: undefined,
                content: externalUrl,
                coverImageUrl: undefined,
                tags: [],
                status: 'published',
                publishedAt: new Date(),
                source: 'crawl',
                sourceUrl: listingUrl,
                externalUrl,
                externalId,
            });
            await this.enrichFromExternalUrl(created._id, externalUrl);
            return true;
        }
        catch (e) {
            const msg = String(e?.message ?? e).toLowerCase();
            if (msg.includes('duplicate key'))
                return false;
            this.logger.debug(`crawl create failed externalUrl=${externalUrl} err=${String(e?.message ?? e)}`);
            return false;
        }
    }
    async enrichFromExternalUrl(newsId, externalUrl) {
        let JSDOM;
        let Readability;
        try {
            ({ JSDOM } = await import('jsdom'));
            ({ Readability } = await import('@mozilla/readability'));
        }
        catch (e) {
            this.logger.warn(`crawl enrich unavailable (jsdom/readability load failed): ${String(e?.message ?? e)}`);
            return;
        }
        const timeoutMs = Number(this.config.get('CRAWL_SCRAPE_TIMEOUT_MS') ?? 12_000);
        const maxBytes = Number(this.config.get('CRAWL_SCRAPE_MAX_BYTES') ?? 1_500_000);
        const started = Date.now();
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), timeoutMs);
        let html = '';
        try {
            const res = await fetch(externalUrl, {
                signal: ctrl.signal,
                headers: {
                    'user-agent': 'Mozilla/5.0 (compatible; backend-news-crawler/1.0; +https://backend)',
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
        if (extractedText.length < 200)
            return;
        const title = (article.title ?? '').trim() ||
            dom.window.document.querySelector('title')?.textContent?.trim() ||
            externalUrl;
        const excerpt = (article.excerpt ?? '').trim() ||
            (extractedText.length > 260
                ? `${extractedText.slice(0, 260).trim()}…`
                : extractedText);
        const ogImage = dom.window.document
            .querySelector('meta[property="og:image"], meta[name="og:image"]')
            ?.getAttribute('content')
            ?.trim() || undefined;
        const firstImg = dom.window.document.querySelector('img')?.getAttribute('src')?.trim() ||
            undefined;
        const coverImageUrl = ogImage ?? firstImg;
        await this.newsModel
            .updateOne({ _id: newsId }, {
            $set: {
                title,
                content: extractedHtml,
                excerpt,
                ...(coverImageUrl ? { coverImageUrl } : {}),
            },
        })
            .exec();
        this.logger.log(`crawl enrich ok ms=${Date.now() - started} url=${externalUrl} chars=${extractedText.length}`);
    }
};
exports.NewsCrawlWorkerService = NewsCrawlWorkerService;
exports.NewsCrawlWorkerService = NewsCrawlWorkerService = NewsCrawlWorkerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, mongoose_1.InjectModel)(news_model_1.NewsModelName)),
    __metadata("design:paramtypes", [config_1.ConfigService, Function, crawl_sources_service_1.CrawlSourcesService])
], NewsCrawlWorkerService);
function toAbsUrl(base, href) {
    try {
        return new URL(href, base).toString();
    }
    catch {
        return undefined;
    }
}
function safeHost(url) {
    try {
        return new URL(url).host;
    }
    catch {
        return undefined;
    }
}
function shortHash(s) {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) {
        h ^= s.charCodeAt(i);
        h = Math.imul(h, 16777619);
    }
    return (h >>> 0).toString(16).slice(0, 12);
}
//# sourceMappingURL=news-crawl-worker.service.js.map