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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
let AiService = class AiService {
    config;
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
    }
    async analyzeComment(text) {
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
            const data = await res.json();
            return normalizeAiResponse(data, this.toxicThreshold, this.version);
        }
        finally {
            clearTimeout(t);
        }
    }
};
exports.AiService = AiService;
exports.AiService = AiService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], AiService);
function normalizeAiResponse(data, toxicThreshold, fallbackVersion) {
    let sentiment = 'neutral';
    const rawSent = data?.sentiment ?? data?.label ?? data?.sentiment_label;
    if (typeof rawSent === 'string') {
        const s = rawSent.toLowerCase();
        if (s.includes('pos'))
            sentiment = 'positive';
        else if (s.includes('neg'))
            sentiment = 'negative';
        else
            sentiment = 'neutral';
    }
    else if (typeof rawSent?.label === 'string') {
        const s = rawSent.label.toLowerCase();
        if (s.includes('pos'))
            sentiment = 'positive';
        else if (s.includes('neg'))
            sentiment = 'negative';
        else
            sentiment = 'neutral';
    }
    const toxScoreRaw = data?.toxicity?.score ??
        data?.toxicity_score ??
        data?.toxicityScore ??
        data?.toxic_score ??
        0;
    const score = clamp01(Number(toxScoreRaw) || 0);
    const isToxic = typeof data?.toxicity?.isToxic === 'boolean'
        ? Boolean(data.toxicity.isToxic)
        : score >= toxicThreshold || String(data?.label ?? '').toLowerCase().includes('toxic');
    const aiVersion = (typeof data?.aiVersion === 'string' ? data.aiVersion : undefined) ??
        (typeof data?.version === 'string' ? data.version : undefined) ??
        fallbackVersion;
    return { sentiment, toxicity: { isToxic, score }, aiVersion };
}
function clamp01(x) {
    if (Number.isNaN(x))
        return 0;
    return Math.max(0, Math.min(1, x));
}
//# sourceMappingURL=ai.service.js.map