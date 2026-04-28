"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AiService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
let AiService = AiService_1 = class AiService {
    config;
    logger = new common_1.Logger(AiService_1.name);
    url;
    timeoutMs;
    toxicThreshold;
    version;
    constructor(config) {
        this.config = config;
        this.url = this.config.get('AI_MODERATION_URL', { infer: true });
        this.timeoutMs = Number(this.config.get('AI_MODERATION_TIMEOUT_MS', { infer: true }) ??
            4000);
        this.toxicThreshold = Number(this.config.get('AI_TOXIC_THRESHOLD', { infer: true }) ?? 0.7);
        this.version = this.config.get('AI_VERSION', { infer: true });
        const safeUrl = this.url ? redactUrl(this.url) : undefined;
        this.logger.log(`config url=${safeUrl ?? 'disabled'} timeoutMs=${this.timeoutMs} toxicThreshold=${this.toxicThreshold} version=${this.version ?? 'n/a'}`);
    }
    async analyzeComment(text) {
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
        this.logger.log(`analyzeComment start url=${redactUrl(this.url)} len=${trimmed.length}`);
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
            const data = await res.json();
            const normalized = normalizeAiResponse(data, this.toxicThreshold, this.version);
            const elapsedMs = Date.now() - startedAt;
            const shape = summarizeAiResponseShape(data);
            this.logger.log(`analyzeComment ok in ${elapsedMs}ms sentiment=${normalized.sentiment} toxic=${normalized.toxicity.isToxic} score=${normalized.toxicity.score.toFixed(3)} shape=${shape}`);
            return normalized;
        }
        catch (e) {
            const elapsedMs = Date.now() - startedAt;
            const isTimeout = e?.name === 'AbortError' ||
                String(e?.message ?? '').toLowerCase().includes('aborted');
            const errMsg = String(e?.message ?? e);
            this.logger.warn(`analyzeComment ${isTimeout ? 'timeout' : 'error'} after ${elapsedMs}ms url=${redactUrl(this.url)}: ${errMsg}`);
            throw e;
        }
        finally {
            clearTimeout(t);
        }
    }
};
exports.AiService = AiService;
exports.AiService = AiService = AiService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], AiService);
function redactUrl(raw) {
    try {
        const u = new URL(raw);
        return `${u.protocol}//${u.host}${u.pathname}`;
    }
    catch {
        return '[invalid-url]';
    }
}
function summarizeAiResponseShape(data) {
    if (data == null)
        return 'null';
    if (Array.isArray(data))
        return `array(len=${data.length})`;
    if (typeof data !== 'object')
        return typeof data;
    const keys = Object.keys(data).sort();
    const hasSentiment = typeof data.sentiment !== 'undefined';
    const hasLabel = typeof data.label !== 'undefined';
    const hasToxicity = typeof data.toxicity !== 'undefined';
    const hasScore = typeof data.toxicity_score !== 'undefined' ||
        typeof data.toxicityScore !== 'undefined' ||
        typeof data.toxic_score !== 'undefined';
    return `object(keys=${keys.slice(0, 8).join(',')}${keys.length > 8 ? ',…' : ''};sentiment=${hasSentiment};label=${hasLabel};toxicity=${hasToxicity};toxScore=${hasScore})`;
}
function normalizeAiResponse(data, toxicThreshold, fallbackVersion) {
    const sentiment4 = parseSentiment4(data);
    const sentiment = mapSentiment4ToCommentSentiment(sentiment4);
    const toxScoreRaw = data?.toxicity?.score ??
        data?.toxicity_score ??
        data?.toxicityScore ??
        data?.toxic_score ??
        0;
    const score = clamp01(Number(toxScoreRaw) || 0);
    const isToxic = typeof data?.toxicity?.isToxic === 'boolean'
        ? Boolean(data.toxicity.isToxic)
        : score >= toxicThreshold ||
            sentiment4 === 'toxic' ||
            String(data?.label ?? '').toLowerCase().includes('toxic');
    const intent = parseIntent(data);
    const aspects = parseAspects(data);
    const sentiment4Scores = parseScoreMap(data?.debug?.sentiment4, ['positive', 'negative', 'neutral', 'toxic']);
    const intentScores = parseScoreMap(data?.debug?.intent, ['praise', 'complain', 'question', 'other']);
    const aspectScores = parseAspectScores(data?.debug?.aspect);
    const aiVersion = (typeof data?.aiVersion === 'string' ? data.aiVersion : undefined) ??
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
function clamp01(x) {
    if (Number.isNaN(x))
        return 0;
    return Math.max(0, Math.min(1, x));
}
function mapSentiment4ToCommentSentiment(s) {
    if (s === 'positive')
        return 'positive';
    if (s === 'negative')
        return 'negative';
    return 'neutral';
}
function parseSentiment4(data) {
    const raw = data?.sentiment4 ??
        data?.sentiment4_label ??
        data?.sentiment_label ??
        data?.sentiment ??
        data?.label ??
        data?.debug?.top_sentiment4 ??
        data?.debug?.sentiment4 ??
        data?.debug?.sentiment_label;
    const s = typeof raw === 'string'
        ? raw
        : typeof raw?.label === 'string'
            ? raw.label
            : null;
    if (!s)
        return null;
    const v = String(s).toLowerCase();
    if (v.includes('toxic'))
        return 'toxic';
    if (v.includes('pos'))
        return 'positive';
    if (v.includes('neg'))
        return 'negative';
    if (v.includes('neu'))
        return 'neutral';
    return null;
}
function parseIntent(data) {
    const raw = data?.intent ??
        data?.intent_label ??
        data?.debug?.top_intent ??
        data?.debug?.intent ??
        data?.debug?.intent_label;
    const s = typeof raw === 'string'
        ? raw
        : typeof raw?.label === 'string'
            ? raw.label
            : null;
    if (!s)
        return null;
    const v = String(s).toLowerCase();
    if (v.includes('praise'))
        return 'praise';
    if (v.includes('complain') || v.includes('complaint'))
        return 'complain';
    if (v.includes('question'))
        return 'question';
    if (v.includes('other'))
        return 'other';
    return null;
}
function parseScoreMap(raw, keys) {
    if (!raw || typeof raw !== 'object')
        return undefined;
    const out = {};
    let count = 0;
    for (const k of keys) {
        const v = Number(raw[k]);
        if (!Number.isNaN(v)) {
            out[k] = v;
            count++;
        }
    }
    return count > 0 ? out : undefined;
}
const ASPECT_KEY_MAP = {
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
function parseAspectScores(raw) {
    if (!raw || typeof raw !== 'object')
        return undefined;
    const out = {};
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
function parseAspects(data) {
    const raw = data?.aspects ?? data?.aspect ?? data?.debug?.aspects ?? data?.debug?.aspect;
    const out = [];
    const push = (x) => {
        const v = String(x ?? '').toLowerCase();
        if (v === 'caster')
            out.push('caster');
        else if (v === 'meta')
            out.push('meta');
        else if (v === 'player/team' || v === 'player_team' || v === 'player' || v === 'team')
            out.push('player_team');
        else if (v === 'giải đấu' || v === 'tournament')
            out.push('tournament');
        else if (v === 'result')
            out.push('result');
        else if (v === 'general')
            out.push('general');
    };
    if (Array.isArray(raw)) {
        for (const x of raw)
            push(x);
    }
    else if (raw && typeof raw === 'object') {
        for (const [k, v] of Object.entries(raw)) {
            const enabled = v === true ||
                v === 1 ||
                (typeof v === 'number' && v >= 0.5) ||
                (typeof v === 'string' && (v === '1' || v.toLowerCase() === 'true'));
            if (enabled)
                push(k);
        }
    }
    return Array.from(new Set(out));
}
//# sourceMappingURL=ai.service.js.map