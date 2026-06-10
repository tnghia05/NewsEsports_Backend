import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { NewsModelName, type NewsDocument } from '../models/news.model';
import { RssService } from '../infra/rss/rss.service';
import { RssSourcesService } from './rss-sources.service';
// NOTE: Do NOT import jsdom/readability at top-level.
// Some production environments run older Node where `jsdom` dependency chain can trigger `ERR_REQUIRE_ESM`.
// We lazy-load them inside `enrichFromExternalUrl` and gracefully fallback to RSS snippet.

@Injectable()
export class NewsImportWorkerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(NewsImportWorkerService.name);
  private timer?: NodeJS.Timeout;
  private running = false;

  private readonly intervalMs: number;
  private readonly maxItemsPerFeed: number;

  constructor(
    private readonly config: ConfigService,
    @InjectModel(NewsModelName) private readonly newsModel: Model<NewsDocument>,
    private readonly rssService: RssService,
    private readonly rssSourcesService: RssSourcesService,
  ) {
    this.intervalMs = Number(
      this.config.get('RSS_IMPORT_INTERVAL_MS') ?? 10 * 60_000,
    );
    this.maxItemsPerFeed = Number(
      this.config.get('RSS_IMPORT_MAX_ITEMS') ?? 30,
    );
  }

  onModuleInit() {
    // Always start; actual import is enabled when DB sources (preferred) or env RSS_SOURCES exist.
    this.timer = setInterval(() => void this.tick(), this.intervalMs);
    void this.tick(); // kick once on startup
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  async importNow() {
    return this.runImport();
  }

  private async tick() {
    if (this.running) return;
    this.running = true;
    try {
      await this.runImport();
    } finally {
      this.running = false;
    }
  }

  private getSourcesFromEnv() {
    const raw = String(this.config.get('RSS_SOURCES') ?? '').trim();
    if (!raw) return [];
    return raw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }

  private async getSources() {
    const fromDb = await this.rssSourcesService.listEnabledUrls();
    if (fromDb.length) return fromDb;
    return this.getSourcesFromEnv();
  }

  private async runImport() {
    const sources = await this.getSources();
    if (!sources.length)
      return { ok: true, imported: 0, skipped: 0, sources: 0 };

    const started = Date.now();
    let imported = 0;
    let skipped = 0;

    for (const feedUrl of sources) {
      try {
        const items = (await this.rssService.fetchFeed(feedUrl)).slice(
          0,
          this.maxItemsPerFeed,
        );
        for (const item of items) {
          const externalId = (item.guid ?? item.link).trim();
          const created = await this.tryCreateFromRss(
            feedUrl,
            item,
            externalId,
          );
          if (created) imported++;
          else skipped++;
        }
        await this.rssSourcesService.markImportResult(feedUrl, { ok: true });
      } catch (e: any) {
        const err = String(e?.message ?? e);
        this.logger.warn(`RSS import failed feed=${feedUrl} err=${err}`);
        await this.rssSourcesService.markImportResult(feedUrl, {
          ok: false,
          error: err,
        });
      }
    }

    const elapsed = Date.now() - started;
    this.logger.log(
      `RSS import done in ${elapsed}ms sources=${sources.length} imported=${imported} skipped=${skipped}`,
    );
    return { ok: true, imported, skipped, sources: sources.length };
  }

  private async tryCreateFromRss(
    feedUrl: string,
    item: { title: string; link: string; publishedAt?: Date; content?: string },
    externalId: string,
  ) {
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

      // Enrich: fetch full article content from externalUrl (best effort).
      // RSS often contains only summary/teaser.
      try {
        await this.enrichFromExternalUrl(created._id, item.link, content);
      } catch (e: any) {
        this.logger.debug(
          `rss enrich skipped externalUrl=${item.link} err=${String(e?.message ?? e)}`,
        );
      }
      return true;
    } catch (e: any) {
      const msg = String(e?.message ?? e).toLowerCase();
      // dedup hits unique index
      if (msg.includes('duplicate key')) return false;
      this.logger.warn(
        `RSS item create failed feed=${feedUrl} externalId=${externalId} err=${String(e?.message ?? e)}`,
      );
      return false;
    }
  }

  private async enrichFromExternalUrl(
    newsId: any,
    externalUrl: string,
    currentContent: string,
  ) {
    let JSDOM: any;
    let Readability: any;
    try {
      // Lazy-load to avoid hard crash on older Node/PM2 environments (ERR_REQUIRE_ESM).
      ({ JSDOM } = await import('jsdom'));
      ({ Readability } = await import('@mozilla/readability'));
    } catch (e: any) {
      this.logger.warn(
        `rss enrich unavailable (jsdom/readability load failed): ${String(e?.message ?? e)}`,
      );
      return;
    }

    // Heuristic: skip if RSS content already looks substantial.
    const curLen = (currentContent ?? '').trim().length;
    if (curLen >= 2000) return;

    const timeoutMs = Number(
      this.config.get('RSS_SCRAPE_TIMEOUT_MS') ?? 12_000,
    );
    const maxBytes = Number(
      this.config.get('RSS_SCRAPE_MAX_BYTES') ?? 1_500_000,
    );

    const started = Date.now();
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    let html = '';
    try {
      const res = await fetch(externalUrl, {
        signal: ctrl.signal,
        headers: {
          'user-agent':
            'Mozilla/5.0 (compatible; backend-rss-import/1.0; +https://backend)',
          accept: 'text/html,application/xhtml+xml',
        },
      });
      if (!res.ok) return;
      html = await res.text();
    } finally {
      clearTimeout(t);
    }

    if (!html || html.length > maxBytes) return;

    const dom = new JSDOM(html, { url: externalUrl });
    const reader = new Readability(dom.window.document);
    const article = reader.parse();
    if (!article?.content) return;

    const extractedHtml = article.content.trim();
    const extractedText = (article.textContent ?? '').trim();

    // If extraction is shorter than RSS content, keep RSS content.
    if (extractedText.length < curLen) return;

    const excerpt =
      (article.excerpt ?? '').trim() ||
      (extractedText.length > 260
        ? `${extractedText.slice(0, 260).trim()}…`
        : extractedText);

    const ogImage =
      dom.window.document
        .querySelector('meta[property=\"og:image\"], meta[name=\"og:image\"]')
        ?.getAttribute('content')
        ?.trim() || undefined;

    const firstImg =
      dom.window.document.querySelector('img')?.getAttribute('src')?.trim() ||
      undefined;

    const coverImageUrl = ogImage ?? firstImg;

    await this.newsModel
      .updateOne(
        { _id: newsId },
        {
          $set: {
            content: extractedHtml,
            excerpt,
            ...(coverImageUrl ? { coverImageUrl } : {}),
          },
        },
      )
      .exec();

    this.logger.log(
      `rss enrich ok ms=${Date.now() - started} url=${externalUrl} chars=${extractedText.length}`,
    );
  }
}

function makeRssSlug(title: string, externalId: string) {
  const base = slugify(title).slice(0, 80) || 'news';
  const suffix = shortHash(externalId);
  return `${base}-${suffix}`;
}

function slugify(input: string) {
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

function shortHash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16).slice(0, 8);
}
