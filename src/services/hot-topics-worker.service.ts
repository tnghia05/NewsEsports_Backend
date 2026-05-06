import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { AiService, type AiModerationResult } from '../infra/ai/ai.service';
import { PostModelName, type PostDocument } from '../models/post.model';
import {
  CommentModelName,
  type CommentDocument,
} from '../models/comment.model';
import {
  HashtagEventModelName,
  type HashtagEventDocument,
} from '../models/hashtag-event.model';
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
  private readonly trendCooldownMs: number;

  constructor(
    private readonly config: ConfigService,
    private readonly aiService: AiService,
    @InjectModel(PostModelName) private readonly postModel: Model<PostDocument>,
    @InjectModel(CommentModelName)
    private readonly commentModel: Model<CommentDocument>,
    @InjectModel(HashtagEventModelName)
    private readonly hashtagEventModel: Model<HashtagEventDocument>,
    @InjectModel(HotTopicModelName)
    private readonly hotTopicModel: Model<HotTopicDocument>,
  ) {
    this.intervalMs = Number(
      this.config.get('HOT_TOPICS_INTERVAL_MS') ?? 60_000,
    );
    this.topN = Number(this.config.get('HOT_TOPICS_TOP_N') ?? 30);
    this.sampleN = Number(this.config.get('HOT_TOPICS_SAMPLE_N') ?? 20);
    // Avoid recomputing the same AI trend every tick.
    // Default: 10 minutes.
    this.trendCooldownMs = Number(
      this.config.get('HOT_TOPICS_TREND_COOLDOWN_MS') ?? 10 * 60_000,
    );
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
    const wMs = windowMs(window);
    const sinceDate = new Date(Date.now() - wMs);
    const recentCutoff = new Date(Date.now() - wMs / 3); // last 1/3 of window for recency boost
    const started = Date.now();

    // Single aggregation: per-tag stats + postIds (avoids scanning posts twice).
    const rows = await this.postModel
      .aggregate([
        { $match: { status: 'published', createdAt: { $gte: sinceDate } } },
        { $unwind: '$tags' },
        {
          $group: {
            _id: '$tags',
            postCount: { $sum: 1 },
            recentPostCount: {
              $sum: { $cond: [{ $gte: ['$createdAt', recentCutoff] }, 1, 0] },
            },
            originalUsers: { $addToSet: '$authorId' },
            postIds: { $addToSet: '$_id' },
          },
        },
        {
          $project: {
            tag: '$_id',
            _id: 0,
            postCount: 1,
            recentPostCount: 1,
            originalUsers: 1,
            postIds: 1,
          },
        },
        { $sort: { postCount: -1 } },
        { $limit: 200 },
      ])
      .exec();

    const tagList = rows.map((r) => String(r.tag)).filter(Boolean);
    if (!tagList.length) {
      await this.hotTopicModel.deleteMany({ window }).exec();
      this.logger.log(
        `recompute window=${window} empty in ${Date.now() - started}ms`,
      );
      return;
    }

    // Build tagToPostIds + post author sets + recent post counts.
    const tagToPostIds = new Map<string, string[]>();
    const tagPostAuthors = new Map<string, Set<string>>();
    const tagRecentPosts = new Map<string, number>();
    const allPostIds: string[] = [];
    for (const r of rows) {
      const tag = String(r.tag);
      const ids = ((r.postIds ?? []) as any[]).map(String);
      tagToPostIds.set(tag, ids);
      tagPostAuthors.set(
        tag,
        new Set(((r.originalUsers ?? []) as any[]).map(String)),
      );
      tagRecentPosts.set(tag, Number(r.recentPostCount) || 0);
      allPostIds.push(...ids);
    }
    const uniquePostIds = [...new Set(allPostIds)];

    // Comment stats per postId: count + recent count + unique authors.
    const commentsByPost =
      uniquePostIds.length > 0
        ? await this.commentModel
            .aggregate([
              {
                $match: {
                  createdAt: { $gte: sinceDate },
                  postId: { $in: uniquePostIds },
                },
              },
              {
                $group: {
                  _id: '$postId',
                  count: { $sum: 1 },
                  recentCount: {
                    $sum: {
                      $cond: [{ $gte: ['$createdAt', recentCutoff] }, 1, 0],
                    },
                  },
                  authors: { $addToSet: '$authorId' },
                },
              },
            ])
            .exec()
        : [];

    const postCommentStats = new Map<
      string,
      { count: number; recentCount: number; authors: string[] }
    >();
    for (const r of commentsByPost) {
      postCommentStats.set(String(r._id), {
        count: Number(r.count) || 0,
        recentCount: Number(r.recentCount) || 0,
        authors: ((r.authors ?? []) as any[]).map(String),
      });
    }

    // Per-tag: comment counts, recent counts, merged unique participants.
    const commentMap = new Map<string, number>();
    const recentCommentMap = new Map<string, number>();
    const mergedUsersMap = new Map<string, number>();
    for (const [tag, pids] of tagToPostIds) {
      let totalComments = 0;
      let recentComments = 0;
      const allAuthors = new Set(tagPostAuthors.get(tag) ?? []);
      for (const pid of pids) {
        const stats = postCommentStats.get(pid);
        if (stats) {
          totalComments += stats.count;
          recentComments += stats.recentCount;
          for (const a of stats.authors) allAuthors.add(a);
        }
      }
      commentMap.set(tag, totalComments);
      recentCommentMap.set(tag, recentComments);
      mergedUsersMap.set(tag, allAuthors.size);
    }

    // Read counts (unique viewers) from hashtag events.
    const readRows = await this.hashtagEventModel
      .aggregate([
        {
          $match: {
            createdAt: { $gte: sinceDate },
            action: 'view',
            tag: { $in: tagList },
          },
        },
        {
          $project: {
            tag: 1,
            viewer: {
              $ifNull: [
                '$userId',
                { $concat: ['sess:', { $ifNull: ['$sessionId', ''] }] },
              ],
            },
          },
        },
        { $match: { viewer: { $ne: 'sess:' } } },
        { $group: { _id: { tag: '$tag', viewer: '$viewer' } } },
        { $group: { _id: '$_id.tag', read: { $sum: 1 } } },
      ])
      .exec();

    const readMap = new Map<string, number>();
    for (const r of readRows) {
      readMap.set(String(r._id), Number(r.read) || 0);
    }

    const now = new Date();
    const bulk = this.hotTopicModel.collection.initializeUnorderedBulkOp();

    const scored: Array<{
      tag: string;
      hotness: number;
      components: { read: number; discuss: number; originalUsers: number };
    }> = [];

    for (const r of rows) {
      const tag = String(r.tag);
      const postCount = Number(r.postCount) || 0;
      const originalUsers = mergedUsersMap.get(tag) ?? 0;
      const commentCount = commentMap.get(tag) ?? 0;
      const read = readMap.get(tag) ?? 0;

      const discuss = postCount + commentCount;

      // Normalize with log1p, then weighted sum (Weibo-like 0.3/0.3/0.4).
      const readScore = Math.log1p(read);
      const discussScore = Math.log1p(discuss);
      const originalScore = Math.log1p(originalUsers);

      const raw = 0.3 * readScore + 0.3 * discussScore + 0.4 * originalScore;

      // Time decay: boost topics with recent activity (last 1/3 of window).
      const recentPosts = tagRecentPosts.get(tag) ?? 0;
      const recentComments = recentCommentMap.get(tag) ?? 0;
      const totalActivity = postCount + commentCount;
      const recentActivity = recentPosts + recentComments;
      const recencyRatio =
        totalActivity > 0 ? recentActivity / totalActivity : 0;
      const recencyBoost = 1 + 0.5 * recencyRatio; // 1.0 .. 1.5

      // Map to 0..10 for UI (smooth mapping with recency boost).
      const hotness = clamp01((raw * recencyBoost) / 4.5) * 10;

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

    // AI breakdown for top topics (parallel with concurrency limit).
    const TREND_CONCURRENCY = 5;
    for (let i = 0; i < topN.length; i += TREND_CONCURRENCY) {
      const batch = topN.slice(i, i + TREND_CONCURRENCY);
      await Promise.allSettled(
        batch.map(async (s) => {
          try {
            const existing = await this.hotTopicModel
              .findOne({ window, tag: s.tag })
              .select({ trendUpdatedAt: 1 })
              .lean()
              .exec();
            const lastTrendAt = (existing as any)?.trendUpdatedAt
              ? new Date((existing as any).trendUpdatedAt).getTime()
              : 0;
            if (lastTrendAt && Date.now() - lastTrendAt < this.trendCooldownMs) {
              return;
            }

            const trend = await this.computeTrendForTag(s.tag, sinceDate);
            if (!trend) return;
            await this.hotTopicModel
              .updateOne(
                { window, tag: s.tag },
                { $set: { trend, trendUpdatedAt: now, updatedAt: now } },
              )
              .exec();
          } catch (e: any) {
            this.logger.warn(`trend ${s.tag}: ${String(e?.message ?? e)}`);
          }
        }),
      );
    }

    // Remove stale topics (use window duration, not interval).
    await this.hotTopicModel
      .deleteMany({ window, updatedAt: { $lt: new Date(Date.now() - wMs) } })
      .exec();

    this.logger.log(
      `recompute window=${window} top=${topN.length} in ${Date.now() - started}ms`,
    );
  }

  private async computeTrendForTag(
    tag: string,
    sinceDate: Date,
  ): Promise<HotTopicTrend | null> {
    const sampleN = Math.min(50, Math.max(1, Number(this.sampleN) || 20));

    // Step 1: get postIds for this tag
    const posts = await this.postModel
      .find({
        status: 'published',
        tags: { $in: [tag] },
        createdAt: { $gte: sinceDate },
      })
      .sort({ createdAt: -1 })
      .limit(200)
      .select({ _id: 1, title: 1, content: 1 })
      .lean()
      .exec();

    const postIds = posts.map((p: any) => String(p._id));

    // Step 2: fetch comments with AI fields already stored by moderation worker
    const comments =
      postIds.length > 0
        ? await this.commentModel
            .find({ postId: { $in: postIds }, createdAt: { $gte: sinceDate } })
            .sort({ createdAt: -1 })
            .limit(sampleN)
            .select({
              content: 1,
              sentiment4: 1,
              intent: 1,
              aspects: 1,
              sentiment4Scores: 1,
              intentScores: 1,
              aspectScores: 1,
              toxicity: 1,
            })
            .lean()
            .exec()
        : [];

    if (comments.length === 0 && posts.length === 0) return null;

    // Step 3: split comments into labeled (reuse) vs unlabeled (need AI call)
    const labeledComments: any[] = [];
    const unlabeledTexts: string[] = [];

    for (const c of comments as any[]) {
      if (c.sentiment4) {
        // Already has AI data from moderation → reuse directly
        labeledComments.push(c);
      } else {
        const t = makeText(c.content ?? '');
        if (t.length > 0) unlabeledTexts.push(t);
      }
    }

    // Fallback to posts only if total samples < sampleN
    const totalFromComments = labeledComments.length + unlabeledTexts.length;
    const postTexts: string[] = [];
    if (totalFromComments < sampleN) {
      for (const p of posts as any[]) {
        if (totalFromComments + postTexts.length >= sampleN) break;
        const t = makeText(`${p.title ?? ''}\n${p.content ?? ''}`);
        if (t.length > 0) postTexts.push(t);
      }
    }

    // Step 4: call AI only for unlabeled comments + fallback posts
    const textsToAnalyze = [...unlabeledTexts, ...postTexts];
    const aiResults: AiModerationResult[] = [];
    if (textsToAnalyze.length > 0) {
      const AI_CONCURRENCY = 5;
      for (let i = 0; i < textsToAnalyze.length; i += AI_CONCURRENCY) {
        const batch = textsToAnalyze.slice(i, i + AI_CONCURRENCY);
        const settled = await Promise.allSettled(
          batch.map((t) => this.aiService.analyzeComment(t)),
        );
        for (const s of settled) {
          if (s.status === 'fulfilled') aiResults.push(s.value);
        }
      }
    }

    // Step 5: accumulate from both sources
    const totalSamples = labeledComments.length + textsToAnalyze.length;
    if (totalSamples === 0) return null;

    const trend: HotTopicTrend = {
      sampleCount: totalSamples,
      labeledCount: 0,
      toxicCount: 0,
      sentiment4: {},
      intent: {},
      aspect: {},
    };

    const acc = {
      sentiment4Sum: {} as Record<string, number>,
      intentSum: {} as Record<string, number>,
      aspectSum: {} as Record<string, number>,
      scoredCount: 0,
    };

    // (A) From pre-labeled comments + (B) From fresh AI calls
    for (const r of [...labeledComments, ...aiResults] as any[]) {
      accumulateResult(trend, acc, r);
    }

    // Step 6: compute averages
    if (acc.scoredCount > 0) {
      trend.sentiment4Avg = divideMap(acc.sentiment4Sum, acc.scoredCount);
      trend.intentAvg = divideMap(acc.intentSum, acc.scoredCount);
      trend.aspectAvg = divideMap(acc.aspectSum, acc.scoredCount);
    }

    return trend;
  }
}

type ScoreAccumulator = {
  sentiment4Sum: Record<string, number>;
  intentSum: Record<string, number>;
  aspectSum: Record<string, number>;
  scoredCount: number;
};

function accumulateResult(trend: HotTopicTrend, acc: ScoreAccumulator, r: any) {
  trend.labeledCount += 1;

  if (r.sentiment4)
    trend.sentiment4[r.sentiment4] = (trend.sentiment4[r.sentiment4] ?? 0) + 1;
  if (r.intent) trend.intent[r.intent] = (trend.intent[r.intent] ?? 0) + 1;
  for (const a of r.aspects ?? []) trend.aspect[a] = (trend.aspect[a] ?? 0) + 1;
  if (r.sentiment4 === 'toxic' || r.toxicity?.isToxic) trend.toxicCount += 1;

  const hasScores = r.sentiment4Scores || r.intentScores || r.aspectScores;
  if (hasScores) acc.scoredCount += 1;

  for (const [k, v] of Object.entries(
    (r.sentiment4Scores ?? {}) as Record<string, number>,
  ))
    acc.sentiment4Sum[k] = (acc.sentiment4Sum[k] ?? 0) + (v ?? 0);
  for (const [k, v] of Object.entries(
    (r.intentScores ?? {}) as Record<string, number>,
  ))
    acc.intentSum[k] = (acc.intentSum[k] ?? 0) + (v ?? 0);
  for (const [k, v] of Object.entries(
    (r.aspectScores ?? {}) as Record<string, number>,
  ))
    acc.aspectSum[k] = (acc.aspectSum[k] ?? 0) + (v ?? 0);
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
