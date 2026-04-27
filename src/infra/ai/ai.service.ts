import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { CommentSentiment } from '../../models/comment.model';
export type { Sentiment4Label, IntentLabel, AspectLabel } from '../../types/ai-labels';
import type { Sentiment4Label, IntentLabel, AspectLabel } from '../../types/ai-labels';

export type AiModerationResult = {
  // legacy fields used by comment moderation
  sentiment: CommentSentiment;
  toxicity: { isToxic: boolean; score: number };

  // optional richer labels (PhoBERT multitask)
  sentiment4?: Sentiment4Label;
  intent?: IntentLabel;
  aspects?: AspectLabel[];

  // raw probability distributions from model debug output
  sentiment4Scores?: Partial<Record<Sentiment4Label, number>>;
  intentScores?: Partial<Record<IntentLabel, number>>;
  aspectScores?: Partial<Record<AspectLabel, number>>;

  aiVersion?: string;
};

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly url?: string;
  private readonly timeoutMs: number;
  private readonly toxicThreshold: number;
  private readonly version?: string;

  constructor(private readonly config: ConfigService) {
    this.url = this.config.get<string>('AI_MODERATION_URL', { infer: true });
    this.timeoutMs = Number(
      this.config.get<string>('AI_MODERATION_TIMEOUT_MS', { infer: true }) ??
        4000,
    );
    this.toxicThreshold = Number(
      this.config.get<string>('AI_TOXIC_THRESHOLD', { infer: true }) ?? 0.7,
    );
    this.version = this.config.get<string>('AI_VERSION', { infer: true });

    const safeUrl = this.url ? redactUrl(this.url) : undefined;
    this.logger.log(
      `config url=${safeUrl ?? 'disabled'} timeoutMs=${this.timeoutMs} toxicThreshold=${this.toxicThreshold} version=${this.version ?? 'n/a'}`,
    );
  }

  /**
   * Calls external PhoBERT moderation service if configured.
   * If not configured, returns a safe fallback (neutral, non-toxic).
   */
  async analyzeComment(text: string): Promise<AiModerationResult> {
    const trimmed = text.trim();
    if (!this.url) {
      this.logger.warn('analyzeComment skipped: AI_MODERATION_URL not set');
      return {
        sentiment: 'neutral',
        toxicity: { isToxic: false, score: 0 },
        aiVersion: this.version,
      };
    }

    const startedAt = Date.now();
    this.logger.log(
      `analyzeComment start url=${redactUrl(this.url)} len=${trimmed.length}`,
    );
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const res = await fetch(this.url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ text: trimmed }),
        signal: controller.signal,
      });
      if (!res.ok) {
        throw new Error(`AI service HTTP ${res.status}`);
      }
      const data: any = await res.json();
      const normalized = normalizeAiResponse(data, this.toxicThreshold, this.version);
      const elapsedMs = Date.now() - startedAt;

      // High-signal logs only (no raw text, no raw payload).
      const shape = summarizeAiResponseShape(data);
      this.logger.log(
        `analyzeComment ok in ${elapsedMs}ms sentiment=${normalized.sentiment} toxic=${normalized.toxicity.isToxic} score=${normalized.toxicity.score.toFixed(
          3,
        )} shape=${shape}`,
      );

      return normalized;
    } catch (e: any) {
      const elapsedMs = Date.now() - startedAt;
      const isTimeout =
        e?.name === 'AbortError' ||
        String(e?.message ?? '').toLowerCase().includes('aborted');
      const errMsg = String(e?.message ?? e);
      this.logger.warn(
        `analyzeComment ${isTimeout ? 'timeout' : 'error'} after ${elapsedMs}ms url=${redactUrl(this.url)}: ${errMsg}`,
      );
      throw e;
    } finally {
      clearTimeout(t);
    }
  }
}

function redactUrl(raw: string) {
  try {
    const u = new URL(raw);
    // don't leak query params (tokens, etc.)
    return `${u.protocol}//${u.host}${u.pathname}`;
  } catch {
    return '[invalid-url]';
  }
}

function summarizeAiResponseShape(data: any) {
  if (data == null) return 'null';
  if (Array.isArray(data)) return `array(len=${data.length})`;
  if (typeof data !== 'object') return typeof data;

  const keys = Object.keys(data).sort();
  const hasSentiment = typeof (data as any).sentiment !== 'undefined';
  const hasLabel = typeof (data as any).label !== 'undefined';
  const hasToxicity = typeof (data as any).toxicity !== 'undefined';
  const hasScore =
    typeof (data as any).toxicity_score !== 'undefined' ||
    typeof (data as any).toxicityScore !== 'undefined' ||
    typeof (data as any).toxic_score !== 'undefined';
  return `object(keys=${keys.slice(0, 8).join(',')}${keys.length > 8 ? ',…' : ''};sentiment=${hasSentiment};label=${hasLabel};toxicity=${hasToxicity};toxScore=${hasScore})`;
}

function normalizeAiResponse(
  data: any,
  toxicThreshold: number,
  fallbackVersion?: string,
): AiModerationResult {
  // Accept several possible shapes:
  // - { sentiment: 'positive'|'neutral'|'negative', toxicity: { score, isToxic? }, aiVersion? }
  // - { sentiment: { label, score }, toxicity_score }
  // - { label: 'Positive'|'Negative'|'Neutral'|'Toxic', score }

  const sentiment4 = parseSentiment4(data);
  const sentiment: CommentSentiment = mapSentiment4ToCommentSentiment(sentiment4);

  const toxScoreRaw =
    data?.toxicity?.score ??
    data?.toxicity_score ??
    data?.toxicityScore ??
    data?.toxic_score ??
    0;
  const score = clamp01(Number(toxScoreRaw) || 0);
  const isToxic =
    typeof data?.toxicity?.isToxic === 'boolean'
      ? Boolean(data.toxicity.isToxic)
      : score >= toxicThreshold ||
        sentiment4 === 'toxic' ||
        String(data?.label ?? '').toLowerCase().includes('toxic');

  const intent = parseIntent(data);
  const aspects = parseAspects(data);

  const sentiment4Scores = parseScoreMap<Sentiment4Label>(
    data?.debug?.sentiment4,
    ['positive', 'negative', 'neutral', 'toxic'],
  );
  const intentScores = parseScoreMap<IntentLabel>(
    data?.debug?.intent,
    ['praise', 'complain', 'question', 'other'],
  );
  const aspectScores = parseAspectScores(data?.debug?.aspect);

  const aiVersion =
    (typeof data?.aiVersion === 'string' ? data.aiVersion : undefined) ??
    (typeof data?.version === 'string' ? data.version : undefined) ??
    fallbackVersion;

  return {
    sentiment,
    toxicity: { isToxic, score },
    sentiment4: sentiment4 ?? undefined,
    intent: intent ?? undefined,
    aspects: aspects.length ? aspects : undefined,
    sentiment4Scores,
    intentScores,
    aspectScores,
    aiVersion,
  };
}

function clamp01(x: number) {
  if (Number.isNaN(x)) return 0;
  return Math.max(0, Math.min(1, x));
}

function mapSentiment4ToCommentSentiment(s: Sentiment4Label | null): CommentSentiment {
  // Comment model currently stores only positive/neutral/negative.
  // "toxic" is represented separately in `toxicity`.
  if (s === 'positive') return 'positive';
  if (s === 'negative') return 'negative';
  return 'neutral';
}

function parseSentiment4(data: any): Sentiment4Label | null {
  // Accept several shapes:
  // - { sentiment4: 'toxic' } or { sentiment: 'toxic' }
  // - { label: 'Toxic' }
  // - { debug: { top_sentiment4: 'toxic' } }
  // - { sentiment: { label: 'Toxic' } }
  const raw =
    data?.sentiment4 ??
    data?.sentiment4_label ??
    data?.sentiment_label ??
    data?.sentiment ??
    data?.label ??
    data?.debug?.top_sentiment4 ??
    data?.debug?.sentiment4 ??
    data?.debug?.sentiment_label;

  const s =
    typeof raw === 'string'
      ? raw
      : typeof raw?.label === 'string'
        ? raw.label
        : null;
  if (!s) return null;

  const v = String(s).toLowerCase();
  if (v.includes('toxic')) return 'toxic';
  if (v.includes('pos')) return 'positive';
  if (v.includes('neg')) return 'negative';
  if (v.includes('neu')) return 'neutral';
  return null;
}

function parseIntent(data: any): IntentLabel | null {
  const raw =
    data?.intent ??
    data?.intent_label ??
    data?.debug?.top_intent ??
    data?.debug?.intent ??
    data?.debug?.intent_label;

  const s =
    typeof raw === 'string'
      ? raw
      : typeof raw?.label === 'string'
        ? raw.label
        : null;
  if (!s) return null;

  const v = String(s).toLowerCase();
  if (v.includes('praise')) return 'praise';
  if (v.includes('complain') || v.includes('complaint')) return 'complain';
  if (v.includes('question')) return 'question';
  if (v.includes('other')) return 'other';
  return null;
}

function parseScoreMap<T extends string>(
  raw: any,
  keys: T[],
): Partial<Record<T, number>> | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const out: Partial<Record<T, number>> = {};
  let count = 0;
  for (const k of keys) {
    const v = Number(raw[k]);
    if (!Number.isNaN(v)) {
      (out as any)[k] = v;
      count++;
    }
  }
  return count > 0 ? out : undefined;
}

const ASPECT_KEY_MAP: Record<string, AspectLabel> = {
  caster: 'caster',
  Caster: 'caster',
  meta: 'meta',
  Meta: 'meta',
  'player/team': 'player_team',
  'Player/Team': 'player_team',
  player_team: 'player_team',
  'giải đấu/tournament': 'tournament',
  'Giải đấu/Tournament': 'tournament',
  tournament: 'tournament',
  result: 'result',
  Result: 'result',
  general: 'general',
  General: 'general',
};

function parseAspectScores(
  raw: any,
): Partial<Record<AspectLabel, number>> | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const out: Partial<Record<AspectLabel, number>> = {};
  let count = 0;
  for (const [k, v] of Object.entries(raw)) {
    const label = ASPECT_KEY_MAP[k];
    if (label && typeof v === 'number') {
      out[label] = v;
      count++;
    }
  }
  return count > 0 ? out : undefined;
}

function parseAspects(data: any): AspectLabel[] {
  // Expected shapes could be:
  // - { aspects: ['meta','player_team'] }
  // - { aspect: { caster: 1, meta: 0, ... } } (or 0/1 booleans)
  // - { debug: { aspects: [...] } }
  // - { debug: { aspect: { ... } } }
  const raw = data?.aspects ?? data?.aspect ?? data?.debug?.aspects ?? data?.debug?.aspect;

  const out: AspectLabel[] = [];
  const push = (x: any) => {
    const v = String(x ?? '').toLowerCase();
    if (v === 'caster') out.push('caster');
    else if (v === 'meta') out.push('meta');
    else if (v === 'player/team' || v === 'player_team' || v === 'player' || v === 'team')
      out.push('player_team');
    else if (v === 'giải đấu' || v === 'tournament') out.push('tournament');
    else if (v === 'result') out.push('result');
    else if (v === 'general') out.push('general');
  };

  if (Array.isArray(raw)) {
    for (const x of raw) push(x);
  } else if (raw && typeof raw === 'object') {
    for (const [k, v] of Object.entries(raw)) {
      const enabled =
        v === true ||
        v === 1 ||
        (typeof v === 'number' && v >= 0.5) ||
        (typeof v === 'string' && (v === '1' || v.toLowerCase() === 'true'));
      if (enabled) push(k);
    }
  }

  // unique
  return Array.from(new Set(out));
}

