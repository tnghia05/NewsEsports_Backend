"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var RssService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RssService = void 0;
const common_1 = require("@nestjs/common");
const fast_xml_parser_1 = require("fast-xml-parser");
let RssService = RssService_1 = class RssService {
    logger = new common_1.Logger(RssService_1.name);
    parser = new fast_xml_parser_1.XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: '@_',
        removeNSPrefix: true,
        cdataPropName: '__cdata',
    });
    async fetchFeed(url) {
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
        const doc = this.parser.parse(xml);
        const items = extractItems(doc);
        return items;
    }
};
exports.RssService = RssService;
exports.RssService = RssService = RssService_1 = __decorate([
    (0, common_1.Injectable)()
], RssService);
function extractItems(doc) {
    const rssItems = doc?.rss?.channel?.item ?? doc?.channel?.item;
    const atomEntries = doc?.feed?.entry;
    const rawList = toArray(rssItems ?? atomEntries ?? []);
    const out = [];
    for (const raw of rawList) {
        const title = textOf(raw?.title)?.trim();
        const link = extractLink(raw);
        if (!title || !link)
            continue;
        const guid = textOf(raw?.guid)?.trim() ?? textOf(raw?.id)?.trim();
        const publishedAt = parseDate(textOf(raw?.pubDate) ??
            textOf(raw?.published) ??
            textOf(raw?.updated) ??
            textOf(raw?.date));
        const content = textOf(raw?.['content:encoded']) ??
            textOf(raw?.content) ??
            textOf(raw?.description) ??
            textOf(raw?.summary);
        out.push({ title, link, guid, publishedAt, content });
    }
    return out;
}
function extractLink(raw) {
    const direct = textOf(raw?.link);
    if (direct)
        return direct.trim();
    const links = toArray(raw?.link);
    for (const l of links) {
        const href = l?.['@_href'];
        if (typeof href === 'string' && href.trim())
            return href.trim();
    }
    return undefined;
}
function toArray(v) {
    if (v == null)
        return [];
    return Array.isArray(v) ? v : [v];
}
function textOf(v) {
    if (v == null)
        return undefined;
    if (typeof v === 'string')
        return v;
    if (typeof v === 'number')
        return String(v);
    if (typeof v === 'object') {
        if (typeof v.__cdata === 'string')
            return v.__cdata;
        if (typeof v['#text'] === 'string')
            return v['#text'];
    }
    return undefined;
}
function parseDate(s) {
    if (!s)
        return undefined;
    const d = new Date(s);
    if (Number.isNaN(d.getTime()))
        return undefined;
    return d;
}
function redactUrl(url) {
    try {
        const u = new URL(url);
        u.search = '';
        return u.toString();
    }
    catch {
        return url;
    }
}
//# sourceMappingURL=rss.service.js.map