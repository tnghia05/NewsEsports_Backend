import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { load } from 'cheerio';
import { NewsModelName, type NewsDocument } from '../models/news.model';
import { CrawlSourcesService } from './crawl-sources.service';

@Injectable()
export class NewsCrawlWorkerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(NewsCrawlWorkerService.name);
  private timer?: NodeJS.Timeout;
  private running = false;

  private readonly intervalMs: number;
  private readonly maxLinksPerSource: number;

  constructor(
    private readonly config: ConfigService,
    @InjectModel(NewsModelName) private readonly newsModel: Model<NewsDocument>,
    private readonly crawlSourcesService: CrawlSourcesService,
  ) {
    this.intervalMs = Number(
      this.config.get('CRAWL_IMPORT_INTERVAL_MS') ?? 15 * 60_000,
    );
    this.maxLinksPerSource = Number(
      this.config.get('CRAWL_IMPORT_MAX_LINKS') ?? 30,
    );
  }

  onModuleInit() {
    this.timer = setInterval(() => void this.tick(), this.intervalMs);
    void this.tick();
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  async crawlNow() {
    return this.runCrawl();
  }

  private async tick() {
    if (this.running) return;
    this.running = true;
    try {
      await this.runCrawl();
    } finally {
      this.running = false;
    }
  }

  private async runCrawl() {
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
          if (created) imported++;
          else skipped++;
        }
        await this.crawlSourcesService.markCrawlResult(listingUrl, {
          ok: true,
        });
      } catch (e: any) {
        const err = String(e?.message ?? e);
        this.logger.warn(`crawl failed listing=${listingUrl} err=${err}`);
        await this.crawlSourcesService.markCrawlResult(listingUrl, {
          ok: false,
          error: err,
        });
      }
    }

    const elapsed = Date.now() - started;
    this.logger.log(
      `crawl done in ${elapsed}ms sources=${sources.length} imported=${imported} skipped=${skipped}`,
    );
    return { ok: true, sources: sources.length, imported, skipped };
  }

  private async fetchListingLinks(listingUrl: string) {
    const started = Date.now();
    const res = await fetch(listingUrl, {
      headers: {
        'user-agent':
          'Mozilla/5.0 (compatible; backend-news-crawler/1.0; +https://backend)',
        accept: 'text/html,application/xhtml+xml',
      },
    });
    if (!res.ok) throw new Error(`listing HTTP ${res.status}`);
    const html = await res.text();
    this.logger.debug(
      `crawl listing ok ms=${Date.now() - started} url=${listingUrl} bytes=${html.length}`,
    );

    const $ = load(html);
    const out = new Set<string>();

    $('a[href]').each((_, el) => {
      const href = String($(el).attr('href') ?? '').trim();
      if (!href) return;
      const abs = toAbsUrl(listingUrl, href);
      if (!abs) return;
      // heuristic: skip obvious non-article links
      if (abs.includes('#') || abs.includes('/tag/') || abs.includes('/tags/'))
        return;
      if (abs.endsWith('.jpg') || abs.endsWith('.png') || abs.endsWith('.webp'))
        return;
      if (!keepListingLinkCandidate(listingUrl, abs)) return;
      out.add(abs);
    });

    // Prefer same-host links
    const host = safeHost(listingUrl);
    const arr = [...out].filter((u) => (host ? safeHost(u) === host : true));
    return arr;
  }

  private async tryCreateFromCrawl(listingUrl: string, externalUrl: string) {
    const externalId = shortHash(externalUrl);
    const slug = `crawl-${externalId}`;

    try {
      const created = await this.newsModel.create({
        title: externalUrl, // will be replaced by enrich step if it succeeds
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

      // Reuse the RSS enrich method in NewsImportWorker via same approach:
      // here we do a small inline Readability extraction to fill title/content/excerpt.
      await this.enrichFromExternalUrl(created._id, externalUrl);
      return true;
    } catch (e: any) {
      const msg = String(e?.message ?? e).toLowerCase();
      if (msg.includes('duplicate key')) return false;
      this.logger.debug(
        `crawl create failed externalUrl=${externalUrl} err=${String(e?.message ?? e)}`,
      );
      return false;
    }
  }

  private async enrichFromExternalUrl(newsId: any, externalUrl: string) {
    let JSDOM: any;
    let Readability: any;
    try {
      ({ JSDOM } = await import('jsdom'));
      ({ Readability } = await import('@mozilla/readability'));
    } catch (e: any) {
      this.logger.warn(
        `crawl enrich unavailable (jsdom/readability load failed): ${String(e?.message ?? e)}`,
      );
      return;
    }

    const timeoutMs = Number(
      this.config.get('CRAWL_SCRAPE_TIMEOUT_MS') ?? 12_000,
    );
    const maxBytes = Number(
      this.config.get('CRAWL_SCRAPE_MAX_BYTES') ?? 1_500_000,
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
            'Mozilla/5.0 (compatible; backend-news-crawler/1.0; +https://backend)',
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
    if (extractedText.length < 200) return;

    const title =
      (article.title ?? '').trim() ||
      dom.window.document.querySelector('title')?.textContent?.trim() ||
      externalUrl;

    const excerpt =
      (article.excerpt ?? '').trim() ||
      (extractedText.length > 260
        ? `${extractedText.slice(0, 260).trim()}…`
        : extractedText);

    const ogImage =
      dom.window.document
        .querySelector('meta[property="og:image"], meta[name="og:image"]')
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
            title,
            content: extractedHtml,
            excerpt,
            ...(coverImageUrl ? { coverImageUrl } : {}),
          },
        },
      )
      .exec();

    this.logger.log(
      `crawl enrich ok ms=${Date.now() - started} url=${externalUrl} chars=${extractedText.length}`,
    );
  }
}

function toAbsUrl(base: string, href: string) {
  try {
    return new URL(href, base).toString();
  } catch {
    return undefined;
  }
}

/**
 * Trang listing (vd esports-c180) thường render full menu → rất nhiều <a> cùng host
 * nhưng là chuyên mục / tiện ích, không phải bài viết. Lọc theo host để tránh crawl “loạn”.
 */
function keepListingLinkCandidate(listingUrl: string, abs: string): boolean {
  let u: URL;
  try {
    u = new URL(abs);
  } catch {
    return false;
  }

  const listingHost = safeHost(listingUrl);
  if (!listingHost || u.hostname !== listingHost) return true;

  if (u.hostname.endsWith('thethao247.vn')) {
    return keepThethao247ArticleLink(u);
  }

  return true;
}

function keepThethao247ArticleLink(u: URL): boolean {
  const p = u.pathname.toLowerCase();

  if (!p.endsWith('.html')) return false;

  const file = p.split('/').filter(Boolean).pop() ?? '';
  const junk = new Set([
    'bao-gia.html',
    'gioi-thieu.html',
    'lien-he.html',
    'chinh-sach-bao-mat.html',
    'dieu-khoan-su-dung.html',
    'dmca.html',
  ]);
  if (junk.has(file)) return false;

  // Chuyên mục dạng /bong-da-viet-nam-c1/ hoặc /esports-c180/ (không phải file .html)
  if (/-c\d+\//i.test(`${p}/`)) return false;

  // Bài: ...-301-649981.html / ...-649981.html / ...-d418889.html (id sau chữ d — xem status bar trình duyệt)
  if (/-d\d+\.html$/i.test(p)) return true;
  if (/-\d+-\d+\.html$/i.test(p)) return true;
  if (/-\d{4,}\.html$/i.test(p)) return true;

  return false;
}

function safeHost(url: string) {
  try {
    return new URL(url).host;
  } catch {
    return undefined;
  }
}

function shortHash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16).slice(0, 12);
}
