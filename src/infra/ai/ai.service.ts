import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { CommentSentiment } from '../../models/comment.model';

export type AiModerationResult = {
  sentiment: CommentSentiment;
  toxicity: { isToxic: boolean; score: number };
  aiVersion?: string;
};

@Injectable()
export class AiService {
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
  }

  /**
   * Calls external PhoBERT moderation service if configured.
   * If not configured, returns a safe fallback (neutral, non-toxic).
   */
  async analyzeComment(text: string): Promise<AiModerationResult> {
    const trimmed = text.trim();
    if (!this.url) {
      return {
        sentiment: 'neutral',
        toxicity: { isToxic: false, score: 0 },
        aiVersion: this.version,
      };
    }

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
      return normalizeAiResponse(data, this.toxicThreshold, this.version);
    } finally {
      clearTimeout(t);
    }
  }
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

  let sentiment: CommentSentiment = 'neutral';
  const rawSent = data?.sentiment ?? data?.label ?? data?.sentiment_label;
  if (typeof rawSent === 'string') {
    const s = rawSent.toLowerCase();
    if (s.includes('pos')) sentiment = 'positive';
    else if (s.includes('neg')) sentiment = 'negative';
    else sentiment = 'neutral';
  } else if (typeof rawSent?.label === 'string') {
    const s = rawSent.label.toLowerCase();
    if (s.includes('pos')) sentiment = 'positive';
    else if (s.includes('neg')) sentiment = 'negative';
    else sentiment = 'neutral';
  }

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
      : score >= toxicThreshold || String(data?.label ?? '').toLowerCase().includes('toxic');

  const aiVersion =
    (typeof data?.aiVersion === 'string' ? data.aiVersion : undefined) ??
    (typeof data?.version === 'string' ? data.version : undefined) ??
    fallbackVersion;

  return { sentiment, toxicity: { isToxic, score }, aiVersion };
}

function clamp01(x: number) {
  if (Number.isNaN(x)) return 0;
  return Math.max(0, Math.min(1, x));
}

