import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import {
  SearchEventModelName,
  type SearchEventDocument,
} from '../models/search-event.model';
import {
  HotKeywordModelName,
  type HotKeywordDocument,
  type HotKeywordWindow,
} from '../models/hot-keyword.model';

@Injectable()
export class HotKeywordsWorkerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(HotKeywordsWorkerService.name);
  private timer?: NodeJS.Timeout;
  private running = false;

  private readonly intervalMs: number;

  constructor(
    private readonly config: ConfigService,
    @InjectModel(SearchEventModelName)
    private readonly searchEventModel: Model<SearchEventDocument>,
    @InjectModel(HotKeywordModelName)
    private readonly hotKeywordModel: Model<HotKeywordDocument>,
  ) {
    this.intervalMs = Number(this.config.get('HOT_KEYWORDS_INTERVAL_MS') ?? 60_000);
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
    for (const r of rows as any[]) {
      const keyword = String(r._id);
      const score = Number(r.score) || 0;
      if (!keyword || score <= 0) continue;
      bulk
        .find({ window, keyword })
        .upsert()
        .updateOne({ $set: { score, updatedAt: now } });
    }

    if (bulk.length > 0) await bulk.execute();

    // prune old keywords not updated recently (optional hygiene)
    await this.hotKeywordModel
      .deleteMany({ window, updatedAt: { $lt: new Date(Date.now() - 30 * 24 * 60 * 60_000) } })
      .exec();

    const elapsed = Date.now() - started;
    this.logger.log(`recompute window=${window} rows=${rows.length} in ${elapsed}ms`);
  }
}

