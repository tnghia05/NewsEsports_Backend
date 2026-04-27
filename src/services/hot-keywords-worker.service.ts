import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { AiService, type AiModerationResult } from '../infra/ai/ai.service';
import {
  SearchEventModelName,
  type SearchEventDocument,
} from '../models/search-event.model';
import {
  HotKeywordModelName,
  type HotKeywordDocument,
  type HotKeywordWindow,
  type HotKeywordTrend,
} from '../models/hot-keyword.model';
import { PostModelName, type PostDocument } from '../models/post.model';
import { CommentModelName, type CommentDocument } from '../models/comment.model';
import { NewsModelName, type NewsDocument } from '../models/news.model';

@Injectable()
export class HotKeywordsWorkerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(HotKeywordsWorkerService.name);
  private timer?: NodeJS.Timeout;
  private running = false;

  private readonly intervalMs: number;
  private readonly trendTopN: number;
  private readonly trendSampleN: number;

  constructor(
    private readonly config: ConfigService,
    private readonly aiService: AiService,
    @InjectModel(SearchEventModelName)
    private readonly searchEventModel: Model<SearchEventDocument>,
    @InjectModel(HotKeywordModelName)
    private readonly hotKeywordModel: Model<HotKeywordDocument>,
    @InjectModel(PostModelName)
    private readonly postModel: Model<PostDocument>,
    @InjectModel(CommentModelName)
    private readonly commentModel: Model<CommentDocument>,
    @InjectModel(NewsModelName)
    private readonly newsModel: Model<NewsDocument>,
  ) {
    this.intervalMs = Number(this.config.get('HOT_KEYWORDS_INTERVAL_MS') ?? 60_000);
    this.trendTopN = Number(this.config.get('HOT_KEYWORDS_TREND_TOP_N') ?? 20);
    this.trendSampleN = Number(this.config.get('HOT_KEYWORDS_TREND_SAMPLE_N') ?? 20);
  }

  onModuleInit() {
    this.timer = setInterval(() => void this.tick(), this.intervalMs);
    void this.tick();
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  private async tick() {
    if (this.running) return;
    this.running = true;
    try {
      await this.recompute('24h');
      await this.recompute('7d');
    } catch (e: any) {
      this.logger.warn(`recompute failed: ${String(e?.message ?? e)}`);
    } finally {
      this.running = false;
    }
  }

  private async recompute(window: HotKeywordWindow) {
    const since = window === '7d' ? Date.now() - 7 * 24 * 60 * 60_000 : Date.now() - 24 * 60 * 60_000;
    const sinceDate = new Date(since);
    const started = Date.now();

    // score: clicks weigh more than searches
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
    const topN = Math.min(Math.max(0, this.trendTopN), 50);
    const topKeywords: string[] = [];

    for (const r of rows as any[]) {
      const keyword = String(r._id);
      const score = Number(r.score) || 0;
      if (!keyword || score <= 0) continue;
      if (topKeywords.length < topN) topKeywords.push(keyword);
      bulk
        .find({ window, keyword })
        .upsert()
        .updateOne({ $set: { score, updatedAt: now } });
    }

    if (bulk.length > 0) await bulk.execute();

    // Trend breakdown (AI-enriched) for top keywords only.
    // We intentionally keep this cheap and bounded: sample click events and label them.
    if (topKeywords.length) {
      const trendStarted = Date.now();
      for (const keyword of topKeywords) {
        const trend = await this.computeTrendForKeyword(keyword, sinceDate);
        if (!trend) continue;
        await this.hotKeywordModel
          .updateOne({ window, keyword }, { $set: { trend, updatedAt: now } })
          .exec();
      }
      this.logger.log(
        `trend window=${window} top=${topKeywords.length} sampleN=${this.trendSampleN} in ${Date.now() - trendStarted}ms`,
      );
    }

    // prune old keywords not updated recently (optional hygiene)
    await this.hotKeywordModel
      .deleteMany({ window, updatedAt: { $lt: new Date(Date.now() - 30 * 24 * 60 * 60_000) } })
      .exec();

    const elapsed = Date.now() - started;
    this.logger.log(`recompute window=${window} rows=${rows.length} in ${elapsed}ms`);
  }

  private async computeTrendForKeyword(keyword: string, sinceDate: Date): Promise<HotKeywordTrend | null> {
    const sampleN = Math.min(50, Math.max(1, Number(this.trendSampleN) || 20));

    const clickEvents = await this.searchEventModel
      .find({
        q: keyword,
        action: 'click',
        createdAt: { $gte: sinceDate },
        targetId: { $exists: true, $ne: null },
      })
      .sort({ createdAt: -1 })
      .limit(sampleN * 2) // allow some misses (deleted targets, unsupported types)
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

    // Batch fetch: group event targetIds by type, then $in query per type.
    const byType: Record<string, string[]> = {};
    for (const ev of clickEvents as any[]) {
      const t = String(ev?.targetType ?? '').toLowerCase();
      const id = typeof ev?.targetId === 'string' ? ev.targetId : null;
      if (!id || !['post', 'comment', 'news'].includes(t)) continue;
      (byType[t] ??= []).push(id);
    }

    const textById = new Map<string, string>();

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

    for (const doc of postDocs as any[]) {
      const t = makeText(`${doc.title ?? ''}\n${doc.content ?? ''}`);
      if (t) textById.set(String(doc._id), t);
    }
    for (const doc of commentDocs as any[]) {
      const t = makeText(doc.content ?? '');
      if (t) textById.set(String(doc._id), t);
    }
    for (const doc of newsDocs as any[]) {
      const t = makeText(`${doc.title ?? ''}\n${doc.content ?? ''}`);
      if (t) textById.set(String(doc._id), t);
    }

    // Collect texts in original event order, respecting sampleN.
    const texts: string[] = [];
    for (const ev of clickEvents as any[]) {
      if (texts.length >= sampleN) break;
      const id = typeof ev?.targetId === 'string' ? ev.targetId : null;
      if (id && textById.has(id)) texts.push(textById.get(id)!);
    }

    // Parallel AI calls with concurrency limit
    const AI_CONCURRENCY = 5;
    const results: AiModerationResult[] = [];
    for (let i = 0; i < texts.length; i += AI_CONCURRENCY) {
      const batch = texts.slice(i, i + AI_CONCURRENCY);
      const settled = await Promise.allSettled(
        batch.map((t) => this.aiService.analyzeComment(t)),
      );
      for (const s of settled) {
        if (s.status === 'fulfilled') results.push(s.value);
      }
    }

    const trend: HotKeywordTrend = {
      sampleCount: texts.length,
      labeledCount: 0,
      toxicCount: 0,
      sentiment4: {},
      intent: {},
      aspect: {},
    };

    const sentiment4Sum: Record<string, number> = {};
    const intentSum: Record<string, number> = {};
    const aspectSum: Record<string, number> = {};
    let scoredCount = 0;

    for (const r of results) {
      trend.labeledCount += 1;

      if (r.sentiment4)
        trend.sentiment4[r.sentiment4] = (trend.sentiment4[r.sentiment4] ?? 0) + 1;
      if (r.intent)
        trend.intent[r.intent] = (trend.intent[r.intent] ?? 0) + 1;
      for (const a of r.aspects ?? [])
        trend.aspect[a] = (trend.aspect[a] ?? 0) + 1;
      if (r.sentiment4 === 'toxic' || r.toxicity.isToxic)
        trend.toxicCount += 1;

      const hasScores = r.sentiment4Scores || r.intentScores || r.aspectScores;
      if (hasScores) scoredCount += 1;

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

}

function makeText(input: string) {
  // Keep payload small; AI service only needs enough context.
  return String(input).trim().replace(/\s+/g, ' ').slice(0, 800);
}

function round4(x: number) {
  return Math.round(x * 10000) / 10000;
}

function divideMap(
  sum: Record<string, number>,
  n: number,
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(sum)) {
    out[k] = round4(v / n);
  }
  return out;
}

