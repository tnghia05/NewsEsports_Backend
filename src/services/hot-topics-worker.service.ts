import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { AiService } from '../infra/ai/ai.service';
import { PostModelName, type PostDocument } from '../models/post.model';
import { CommentModelName, type CommentDocument } from '../models/comment.model';
import { HashtagEventModelName, type HashtagEventDocument } from '../models/hashtag-event.model';
import {
  HotTopicModelName,
  type HotTopicDocument,
  type HotTopicTrend,
  type HotTopicWindow,
} from '../models/hot-topic.model';

@Injectable()
export class HotTopicsWorkerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(HotTopicsWorkerService.name);
  private timer?: NodeJS.Timeout;
  private running = false;

  private readonly intervalMs: number;
  private readonly topN: number;
  private readonly sampleN: number;

  constructor(
    private readonly config: ConfigService,
    private readonly aiService: AiService,
    @InjectModel(PostModelName) private readonly postModel: Model<PostDocument>,
    @InjectModel(CommentModelName) private readonly commentModel: Model<CommentDocument>,
    @InjectModel(HashtagEventModelName)
    private readonly hashtagEventModel: Model<HashtagEventDocument>,
    @InjectModel(HotTopicModelName) private readonly hotTopicModel: Model<HotTopicDocument>,
  ) {
    this.intervalMs = Number(this.config.get('HOT_TOPICS_INTERVAL_MS') ?? 60_000);
    this.topN = Number(this.config.get('HOT_TOPICS_TOP_N') ?? 30);
    this.sampleN = Number(this.config.get('HOT_TOPICS_SAMPLE_N') ?? 20);
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
      await this.recompute('3h');
      await this.recompute('24h');
      await this.recompute('7d');
    } catch (e: any) {
      this.logger.warn(`recompute failed: ${String(e?.message ?? e)}`);
    } finally {
      this.running = false;
    }
  }

  private async recompute(window: HotTopicWindow) {
    const sinceDate = new Date(Date.now() - windowMs(window));
    const started = Date.now();

    // Aggregate per tag:
    // - read: unique viewers (userId preferred, otherwise sessionId)
    // - discuss: posts + comments
    // - originalUsers: unique post authors
    const rows = await this.postModel
      .aggregate([
        { $match: { status: 'published', createdAt: { $gte: sinceDate } } },
        { $unwind: '$tags' },
        {
          $group: {
            _id: '$tags',
            postCount: { $sum: 1 },
            originalUsers: { $addToSet: '$authorId' },
          },
        },
        {
          $project: {
            tag: '$_id',
            _id: 0,
            postCount: 1,
            originalUsersCount: { $size: '$originalUsers' },
          },
        },
        { $sort: { postCount: -1 } },
        { $limit: 200 },
      ])
      .exec();

    const tagList = (rows as any[]).map((r) => String(r.tag)).filter(Boolean);
    if (!tagList.length) {
      await this.hotTopicModel.deleteMany({ window }).exec();
      this.logger.log(`recompute window=${window} empty in ${Date.now() - started}ms`);
      return;
    }

    // Comment counts for posts with tag, within window.
    const commentCounts = await this.commentModel
      .aggregate([
        { $match: { createdAt: { $gte: sinceDate } } },
        {
          $lookup: {
            from: this.postModel.collection.name,
            localField: 'postId',
            foreignField: '_id',
            as: 'post',
          },
        },
        { $unwind: '$post' },
        { $match: { 'post.status': 'published', 'post.tags': { $in: tagList } } },
        { $unwind: '$post.tags' },
        { $match: { 'post.tags': { $in: tagList } } },
        { $group: { _id: '$post.tags', commentCount: { $sum: 1 } } },
      ])
      .exec();

    const commentMap = new Map<string, number>();
    for (const r of commentCounts as any[]) {
      commentMap.set(String(r._id), Number(r.commentCount) || 0);
    }

    // Read counts (unique viewers) from hashtag events.
    const readRows = await this.hashtagEventModel
      .aggregate([
        { $match: { createdAt: { $gte: sinceDate }, action: 'view', tag: { $in: tagList } } },
        {
          $project: {
            tag: 1,
            viewer: {
              $ifNull: ['$userId', { $concat: ['sess:', { $ifNull: ['$sessionId', ''] }] }],
            },
          },
        },
        { $match: { viewer: { $ne: 'sess:' } } },
        { $group: { _id: { tag: '$tag', viewer: '$viewer' } } },
        { $group: { _id: '$_id.tag', read: { $sum: 1 } } },
      ])
      .exec();

    const readMap = new Map<string, number>();
    for (const r of readRows as any[]) {
      readMap.set(String(r._id), Number(r.read) || 0);
    }

    const now = new Date();
    const bulk = this.hotTopicModel.collection.initializeUnorderedBulkOp();

    const scored: Array<{
      tag: string;
      hotness: number;
      components: { read: number; discuss: number; originalUsers: number };
    }> = [];

    for (const r of rows as any[]) {
      const tag = String(r.tag);
      const postCount = Number(r.postCount) || 0;
      const originalUsers = Number(r.originalUsersCount) || 0;
      const commentCount = commentMap.get(tag) ?? 0;
      const read = readMap.get(tag) ?? 0;

      const discuss = postCount + commentCount;

      // Normalize with log1p, then weighted sum (Weibo-like 0.3/0.3/0.4).
      const readScore = Math.log1p(read);
      const discussScore = Math.log1p(discuss);
      const originalScore = Math.log1p(originalUsers);

      const raw =
        0.3 * readScore +
        0.3 * discussScore +
        0.4 * originalScore;

      // Map to 0..10 for UI (simple clamp + scaling).
      // (Weibo uses bucket scoring; we approximate with a smooth mapping.)
      const hotness = clamp01(raw / 3) * 10;

      scored.push({
        tag,
        hotness,
        components: { read, discuss, originalUsers },
      });
    }

    scored.sort((a, b) => b.hotness - a.hotness);
    const topN = scored.slice(0, Math.min(Math.max(1, this.topN), 50));

    for (const s of topN) {
      bulk
        .find({ window, tag: s.tag })
        .upsert()
        .updateOne({
          $set: {
            hotness: round2(s.hotness),
            components: s.components,
            updatedAt: now,
          },
        });
    }

    if (bulk.length > 0) await bulk.execute();

    // AI breakdown for top topics
    for (const s of topN) {
      const trend = await this.computeTrendForTag(s.tag, sinceDate);
      if (!trend) continue;
      await this.hotTopicModel
        .updateOne({ window, tag: s.tag }, { $set: { trend, updatedAt: now } })
        .exec();
    }

    // Remove stale topics for this window
    await this.hotTopicModel
      .deleteMany({ window, updatedAt: { $lt: new Date(Date.now() - 2 * this.intervalMs) } })
      .exec();

    this.logger.log(`recompute window=${window} top=${topN.length} in ${Date.now() - started}ms`);
  }

  private async computeTrendForTag(tag: string, sinceDate: Date): Promise<HotTopicTrend | null> {
    const sampleN = Math.min(50, Math.max(1, Number(this.sampleN) || 20));

    const posts = await this.postModel
      .find({ status: 'published', tags: { $in: [tag] }, createdAt: { $gte: sinceDate } })
      .sort({ createdAt: -1 })
      .limit(sampleN)
      .select({ title: 1, content: 1 })
      .lean()
      .exec();

    const postIds = posts.map((p: any) => String(p._id));
    const comments =
      postIds.length > 0
        ? await this.commentModel
            .find({ postId: { $in: postIds }, createdAt: { $gte: sinceDate } })
            .sort({ createdAt: -1 })
            .limit(sampleN)
            .select({ content: 1 })
            .lean()
            .exec()
        : [];

    const texts: string[] = [];
    for (const p of posts as any[]) {
      if (texts.length >= sampleN) break;
      texts.push(makeText(`${p.title ?? ''}\n${p.content ?? ''}`));
    }
    for (const c of comments as any[]) {
      if (texts.length >= sampleN) break;
      texts.push(makeText(c.content ?? ''));
    }

    const trend: HotTopicTrend = {
      sampleCount: texts.length,
      labeledCount: 0,
      toxicCount: 0,
      sentiment4: {},
      intent: {},
      aspect: {},
    };

    for (const text of texts) {
      try {
        const r = await this.aiService.analyzeComment(text);
        trend.labeledCount += 1;
        if (r.sentiment4) trend.sentiment4[r.sentiment4] = (trend.sentiment4[r.sentiment4] ?? 0) + 1;
        if (r.intent) trend.intent[r.intent] = (trend.intent[r.intent] ?? 0) + 1;
        for (const a of r.aspects ?? []) trend.aspect[a] = (trend.aspect[a] ?? 0) + 1;
        if (r.sentiment4 === 'toxic' || r.toxicity.isToxic) trend.toxicCount += 1;
      } catch {
        // ignore
      }
    }

    return trend;
  }
}

function windowMs(w: HotTopicWindow) {
  if (w === '7d') return 7 * 24 * 60 * 60_000;
  if (w === '24h') return 24 * 60 * 60_000;
  return 3 * 60 * 60_000;
}

function makeText(input: string) {
  return String(input).trim().replace(/\s+/g, ' ').slice(0, 800);
}

function clamp01(x: number) {
  if (Number.isNaN(x)) return 0;
  return Math.max(0, Math.min(1, x));
}

function round2(x: number) {
  return Math.round(x * 100) / 100;
}

