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
import {
  AdminAlertModelName,
  type AdminAlertDocument,
} from '../models/admin-alert.model';
import {
  EntityTrendModelName,
  type EntityTrendDocument,
  type EntityTrendWindow,
} from '../models/entity-trend.model';
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
import {
  PostLikeModelName,
  type PostLikeDocument,
} from '../models/post-like.model';
import {
  HotKeywordModelName,
  type HotKeywordDocument,
} from '../models/hot-keyword.model';

@Injectable()
export class HotTopicsWorkerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(HotTopicsWorkerService.name);
  private timer?: NodeJS.Timeout;
  private running = false;
  private lastManualTriggerAt = 0;
  private readonly MANUAL_DEBOUNCE_MS = 30_000;

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
    @InjectModel(AdminAlertModelName)
    private readonly adminAlertModel: Model<AdminAlertDocument>,
    @InjectModel(EntityTrendModelName)
    private readonly entityTrendModel: Model<EntityTrendDocument>,
    @InjectModel(PostLikeModelName)
    private readonly postLikeModel: Model<PostLikeDocument>,
    @InjectModel(HotKeywordModelName)
    private readonly hotKeywordModel: Model<HotKeywordDocument>,
  ) {
    this.intervalMs = Number(
      this.config.get('HOT_TOPICS_INTERVAL_MS') ?? 300_000,
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

  /** Manual trigger — rate-limited to once per 30s. Returns false if debounced. */
  async triggerRecompute(): Promise<{ triggered: boolean; message: string }> {
    const now = Date.now();
    const remaining =
      this.MANUAL_DEBOUNCE_MS - (now - this.lastManualTriggerAt);
    if (remaining > 0) {
      this.logger.log(
        `[manual-refresh] debounced — ${Math.ceil(remaining / 1000)}s remaining`,
      );
      return {
        triggered: false,
        message: `Vui lòng chờ ${Math.ceil(remaining / 1000)}s trước khi làm mới lại.`,
      };
    }
    if (this.running) {
      this.logger.log('[manual-refresh] already running, skipped');
      return { triggered: false, message: 'Đang recompute, vui lòng chờ.' };
    }
    this.lastManualTriggerAt = now;
    this.logger.log('[manual-refresh] triggered by user — starting recompute');
    this.tick().catch((e: any) =>
      this.logger.error(
        `[manual-refresh] tick error: ${String(e?.message ?? e)}`,
      ),
    );
    return { triggered: true, message: 'Đã kích hoạt recompute.' };
  }

  private async tick() {
    if (this.running) return;
    this.running = true;
    const t0 = Date.now();
    this.logger.log('[tick] start recompute — 3h / 24h / 7d');
    try {
      await this.recompute('3h');
      this.logger.log('[tick] 3h done');
      await this.recompute('24h');
      this.logger.log('[tick] 24h done');
      await this.recompute('7d');
      this.logger.log('[tick] 7d done');
      await this.detectToxicitySpikes();
      this.logger.log('[tick] toxicity spikes checked');
      await this.recomputeEntityTrends('3h');
      await this.recomputeEntityTrends('24h');
      await this.recomputeEntityTrends('7d');
      this.logger.log(`[tick] entity trends done — total ${Date.now() - t0}ms`);
    } catch (e: any) {
      this.logger.warn(`[tick] failed: ${String(e?.message ?? e)}`);
    } finally {
      this.running = false;
    }
  }

  // Entity trending: aggregate mentions + sentiment per NER entity per window.
  private async recomputeEntityTrends(window: EntityTrendWindow) {
    const since = new Date(Date.now() - windowMs(window));
    const now = new Date();

    const rows = await this.commentModel
      .aggregate([
        {
          $match: {
            createdAt: { $gte: since },
            aiEntities: { $exists: true, $not: { $size: 0 } },
          },
        },
        { $unwind: '$aiEntities' },
        {
          $group: {
            _id: { entity: '$aiEntities.text', type: '$aiEntities.type' },
            mentionCount: { $sum: 1 },
            positiveCount: {
              $sum: { $cond: [{ $eq: ['$sentiment4', 'positive'] }, 1, 0] },
            },
            negativeCount: {
              $sum: { $cond: [{ $eq: ['$sentiment4', 'negative'] }, 1, 0] },
            },
            neutralCount: {
              $sum: { $cond: [{ $eq: ['$sentiment4', 'neutral'] }, 1, 0] },
            },
            toxicCount: {
              $sum: { $cond: [{ $eq: ['$sentiment4', 'toxic'] }, 1, 0] },
            },
            praiseCount: {
              $sum: { $cond: [{ $eq: ['$intent', 'praise'] }, 1, 0] },
            },
            complainCount: {
              $sum: { $cond: [{ $eq: ['$intent', 'complain'] }, 1, 0] },
            },
            questionCount: {
              $sum: { $cond: [{ $eq: ['$intent', 'question'] }, 1, 0] },
            },
            otherCount: {
              $sum: { $cond: [{ $eq: ['$intent', 'other'] }, 1, 0] },
            },
          },
        },
        { $sort: { mentionCount: -1 } },
        { $limit: 100 },
      ])
      .exec();

    if (!rows.length) return;

    const bulk = this.entityTrendModel.collection.initializeUnorderedBulkOp();

    for (const r of rows) {
      const total = Number(r.mentionCount) || 1;
      bulk
        .find({ entity: r._id.entity, entityType: r._id.type, window })
        .upsert()
        .updateOne({
          $set: {
            mentionCount: total,
            sentiment: {
              positive: Number(r.positiveCount),
              negative: Number(r.negativeCount),
              neutral: Number(r.neutralCount),
              toxic: Number(r.toxicCount),
            },
            toxicRate: round4(Number(r.toxicCount) / total),
            intent: {
              praise: Number(r.praiseCount),
              complain: Number(r.complainCount),
              question: Number(r.questionCount),
              other: Number(r.otherCount),
            },
            updatedAt: now,
          },
        });
    }

    if (bulk.length > 0) await bulk.execute();

    await this.entityTrendModel
      .deleteMany({
        window,
        updatedAt: { $lt: new Date(Date.now() - windowMs(window)) },
      })
      .exec();

    this.logger.log(`entityTrends window=${window} entities=${rows.length}`);
  }

  // #9 Toxicity spike: compare 3h toxic ratio vs 24h toxic ratio per tag.
  // If 3h ratio > 2x 24h ratio AND 3h has enough samples → create alert.
  private async detectToxicitySpikes() {
    const [topics3h, topics24h] = await Promise.all([
      this.hotTopicModel
        .find({ window: '3h', 'trend.sampleCount': { $gt: 0 } })
        .select({ tag: 1, trend: 1 })
        .lean()
        .exec(),
      this.hotTopicModel
        .find({ window: '24h', 'trend.sampleCount': { $gt: 0 } })
        .select({ tag: 1, trend: 1 })
        .lean()
        .exec(),
    ]);

    const ratio24hMap = new Map<string, number>();
    for (const t of topics24h as any[]) {
      const trend = t.trend;
      if (trend?.sampleCount > 0) {
        ratio24hMap.set(
          String(t.tag),
          (trend.toxicCount ?? 0) / trend.sampleCount,
        );
      }
    }

    const MIN_SAMPLES = 5;
    const SPIKE_MULTIPLIER = 2;

    for (const t of topics3h as any[]) {
      const trend = t.trend;
      if (!trend || trend.sampleCount < MIN_SAMPLES) continue;

      const ratio3h = (trend.toxicCount ?? 0) / trend.sampleCount;
      const ratio24h = ratio24hMap.get(String(t.tag)) ?? 0;

      if (ratio3h > SPIKE_MULTIPLIER * ratio24h && ratio3h > 0.1) {
        await this.adminAlertModel
          .findOneAndUpdate(
            {
              type: 'toxicity_spike',
              tag: String(t.tag),
              createdAt: { $gte: new Date(Date.now() - 60 * 60_000) },
            },
            {
              $setOnInsert: {
                type: 'toxicity_spike',
                tag: String(t.tag),
                ratio3h: Math.round(ratio3h * 1000) / 1000,
                ratio24h: Math.round(ratio24h * 1000) / 1000,
                isRead: false,
              },
            },
            { upsert: true },
          )
          .exec();
        this.logger.warn(
          `toxicity_spike tag=${t.tag} ratio3h=${ratio3h.toFixed(3)} ratio24h=${ratio24h.toFixed(3)}`,
        );
      }
    }
  }

  private async recompute(window: HotTopicWindow) {
    const wMs = windowMs(window);
    const sinceDate = new Date(Date.now() - wMs);
    const recentCutoff = new Date(Date.now() - wMs / 3); // last 1/3 of window for recency boost
    const started = Date.now();

    // #1 Velocity: snapshot previous hotness before overwriting
    const prevDocs = await this.hotTopicModel
      .find({ window })
      .select({ tag: 1, hotness: 1 })
      .lean()
      .exec();
    const prevHotnessMap = new Map<string, number>();
    for (const d of prevDocs)
      prevHotnessMap.set(String(d.tag), Number(d.hotness) || 0);

    // Find postIds that have new comments in the window (so commenting on an old post counts).
    const commentPostIds = await this.commentModel
      .distinct('postId', { createdAt: { $gte: sinceDate } })
      .exec();

    // Single aggregation: per-tag stats + postIds (avoids scanning posts twice).
    // Include posts created in window OR posts that received comments in window.
    const rows = await this.postModel
      .aggregate([
        {
          $match: {
            status: 'published',
            $or: [
              { createdAt: { $gte: sinceDate } },
              ...(commentPostIds.length > 0
                ? [{ _id: { $in: commentPostIds } }]
                : []),
            ],
          },
        },
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
    this.logger.log(
      `recompute window=${window} found ${rows.length} tagged posts — tags=[${tagList.slice(0, 5).join(', ')}${tagList.length > 5 ? ', ...' : ''}]`,
    );
    if (!tagList.length) {
      await this.hotTopicModel.deleteMany({ window }).exec();
      this.logger.log(
        `recompute window=${window} empty (no published posts with tags in last ${window}) in ${Date.now() - started}ms`,
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

    // #2 Like signal: likes on active posts within window
    const likeRows =
      uniquePostIds.length > 0
        ? await this.postLikeModel
            .aggregate([
              {
                $match: {
                  postId: { $in: uniquePostIds },
                  createdAt: { $gte: sinceDate },
                },
              },
              { $group: { _id: '$postId', count: { $sum: 1 } } },
            ])
            .exec()
        : [];
    const postLikeMap = new Map<string, number>();
    for (const r of likeRows)
      postLikeMap.set(String(r._id), Number(r.count) || 0);

    const tagLikeMap = new Map<string, number>();
    for (const [tag, pids] of tagToPostIds) {
      tagLikeMap.set(
        tag,
        pids.reduce((s, pid) => s + (postLikeMap.get(pid) ?? 0), 0),
      );
    }

    // #4 Search volume: merge HotKeyword scores for matching tags
    const kwWindow = window === '7d' ? '7d' : '24h';
    const kwDocs =
      tagList.length > 0
        ? await this.hotKeywordModel
            .find({ window: kwWindow, keyword: { $in: tagList } })
            .select({ keyword: 1, score: 1 })
            .lean()
            .exec()
        : [];
    const searchMap = new Map<string, number>();
    for (const kw of kwDocs)
      searchMap.set(String(kw.keyword), Number(kw.score) || 0);

    const now = new Date();
    const bulk = this.hotTopicModel.collection.initializeUnorderedBulkOp();

    const scored: Array<{
      tag: string;
      hotness: number;
      components: {
        read: number;
        discuss: number;
        originalUsers: number;
        likes: number;
        searchVolume: number;
        velocityScore: number;
      };
    }> = [];

    for (const r of rows) {
      const tag = String(r.tag);
      const postCount = Number(r.postCount) || 0;
      const originalUsers = mergedUsersMap.get(tag) ?? 0;
      const commentCount = commentMap.get(tag) ?? 0;
      const read = readMap.get(tag) ?? 0;
      const likes = tagLikeMap.get(tag) ?? 0;
      const searchVolume = searchMap.get(tag) ?? 0;

      // #3 Minimum quality threshold: skip singleton topics (1 user only)
      if (originalUsers < 2) continue;

      const discuss = postCount + commentCount;

      // 5-signal weighted formula (Weibo-inspired)
      const readScore = Math.log1p(read);
      const discussScore = Math.log1p(discuss);
      const originalScore = Math.log1p(originalUsers);
      const likeScore = Math.log1p(likes);
      const searchScore = Math.log1p(searchVolume);

      const raw =
        0.2 * readScore +
        0.2 * discussScore +
        0.25 * originalScore +
        0.15 * likeScore +
        0.2 * searchScore;

      // #5 Score decay: topics with no recent activity are penalized
      // decayFactor range: 0.4 (all old activity) → 1.6 (all recent)
      const recentPosts = tagRecentPosts.get(tag) ?? 0;
      const recentComments = recentCommentMap.get(tag) ?? 0;
      const totalActivity = postCount + commentCount;
      const recentActivity = recentPosts + recentComments;
      const recencyRatio =
        totalActivity > 0 ? recentActivity / totalActivity : 0;
      const decayFactor = 0.4 + 1.2 * recencyRatio; // 0.4 .. 1.6

      const baseHotness = clamp01((raw * decayFactor) / 4.5) * 10;

      // #1 Velocity: compare vs previous tick hotness
      const prevH = prevHotnessMap.get(tag) ?? 0;
      const velocity = prevH > 0 ? baseHotness / (prevH + 0.1) : 1.0;
      // velocityBoost: 0.85 (shrinking) → 1.0 (stable) → 1.35 (3× spike)
      const velocityBoost =
        0.85 + 0.15 * clamp01(Math.log1p(velocity) / Math.log1p(3));

      const hotness = clamp01((baseHotness * velocityBoost) / 10) * 10;

      scored.push({
        tag,
        hotness,
        components: {
          read,
          discuss,
          originalUsers,
          likes,
          searchVolume,
          velocityScore: round2(velocity),
        },
      });
    }

    scored.sort((a, b) => b.hotness - a.hotness);
    const topN = scored.slice(0, Math.min(Math.max(1, this.topN), 50));
    this.logger.log(
      `recompute window=${window} scored top3=[${topN
        .slice(0, 3)
        .map((s) => `${s.tag}:${s.hotness.toFixed(2)}`)
        .join(', ')}]`,
    );

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
            if (
              lastTrendAt &&
              Date.now() - lastTrendAt < this.trendCooldownMs
            ) {
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
