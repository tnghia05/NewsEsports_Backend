import { Injectable, Logger } from '@nestjs/common';
import { XMLParser } from 'fast-xml-parser';

export type RssItem = {
  title: string;
  link: string;
  guid?: string;
  publishedAt?: Date;
  content?: string;
};

@Injectable()
export class RssService {
  private readonly logger = new Logger(RssService.name);
  private readonly parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    removeNSPrefix: true,
    // Some feeds have HTML in CDATA; keep it.
    cdataPropName: '__cdata',
  });

  async fetchFeed(url: string): Promise<RssItem[]> {
    const started = Date.now();
    const res = await fetch(url, {
      headers: {
        'user-agent': 'backend-rss-import/1.0',
        accept: 'application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.8',
      },
    });
    if (!res.ok) {
      throw new Error(`RSS HTTP ${res.status}`);
    }
    const xml = await res.text();
    const elapsed = Date.now() - started;
    this.logger.log(`fetchFeed ok in ${elapsed}ms url=${redactUrl(url)} bytes=${xml.length}`);

    const doc: any = this.parser.parse(xml);
    const items = extractItems(doc);
    return items;
  }
}

function extractItems(doc: any): RssItem[] {
  // RSS2: { rss: { channel: { item: [...] } } }
  const rssItems = doc?.rss?.channel?.item ?? doc?.channel?.item;
  // Atom: { feed: { entry: [...] } }
  const atomEntries = doc?.feed?.entry;

  const rawList = toArray(rssItems ?? atomEntries ?? []);
  const out: RssItem[] = [];
  for (const raw of rawList) {
    const title = textOf(raw?.title)?.trim();
    const link = extractLink(raw);
    if (!title || !link) continue;
    const guid = textOf(raw?.guid)?.trim() ?? textOf(raw?.id)?.trim();
    const publishedAt = parseDate(
      textOf(raw?.pubDate) ??
        textOf(raw?.published) ??
        textOf(raw?.updated) ??
        textOf(raw?.date),
    );

    const content =
      textOf(raw?.['content:encoded']) ??
      textOf(raw?.content) ??
      textOf(raw?.description) ??
      textOf(raw?.summary);

    out.push({ title, link, guid, publishedAt, content });
  }
  return out;
}

function extractLink(raw: any): string | undefined {
  // RSS: <link>https://...</link>
  const direct = textOf(raw?.link);
  if (direct) return direct.trim();

  // Atom: <link href="..."/>
  const links = toArray(raw?.link);
  for (const l of links) {
    const href = l?.['@_href'];
    if (typeof href === 'string' && href.trim()) return href.trim();
  }
  return undefined;
}

function toArray<T>(v: T | T[]): T[] {
  if (v == null) return [];
  return Array.isArray(v) ? v : [v];
}

function textOf(v: any): string | undefined {
  if (v == null) return undefined;
  if (typeof v === 'string') return v;
  if (typeof v === 'number') return String(v);
  if (typeof v === 'object') {
    // fast-xml-parser may wrap cdata
    if (typeof v.__cdata === 'string') return v.__cdata;
    if (typeof v['#text'] === 'string') return v['#text'];
  }
  return undefined;
}

function parseDate(s?: string): Date | undefined {
  if (!s) return undefined;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return undefined;
  return d;
}

function redactUrl(url: string) {
  try {
    const u = new URL(url);
    u.search = '';
    return u.toString();
  } catch {
    return url;
  }
}

