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
var PandaScoreService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PandaScoreService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
let PandaScoreService = PandaScoreService_1 = class PandaScoreService {
    config;
    logger = new common_1.Logger(PandaScoreService_1.name);
    baseUrl = 'https://api.pandascore.co';
    timeoutMs = 15_000;
    token;
    constructor(config) {
        this.config = config;
        this.token = this.config.get('PANDASCORE_TOKEN') ?? '';
    }
    get isConfigured() {
        return Boolean(this.token);
    }
    async fetchRunningMatches(perPage = 50) {
        return this.fetchPage('/matches/running', { per_page: perPage, sort: '-begin_at' });
    }
    async fetchUpcomingMatches(perPage = 50) {
        const now = new Date();
        const in7days = new Date(now.getTime() + 7 * 24 * 60 * 60_000);
        return this.fetchPage('/matches/upcoming', {
            per_page: perPage,
            sort: 'scheduled_at',
            'range[scheduled_at]': `${now.toISOString()},${in7days.toISOString()}`,
        });
    }
    async fetchPastMatches(perPage = 50) {
        const now = new Date();
        const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60_000);
        return this.fetchPage('/matches/past', {
            per_page: perPage,
            sort: '-begin_at',
            'range[begin_at]': `${twoDaysAgo.toISOString()},${now.toISOString()}`,
        });
    }
    async fetchMatchDetail(matchIdOrSlug) {
        const safe = encodeURIComponent(matchIdOrSlug);
        return this.fetchJson(`/matches/${safe}`);
    }
    async fetchMatchOpponents(matchIdOrSlug) {
        const safe = encodeURIComponent(matchIdOrSlug);
        return this.fetchJson(`/matches/${safe}/opponents`);
    }
    async fetchLoLGame(gameId) {
        const safe = encodeURIComponent(gameId);
        return this.fetchJson(`/lol/games/${safe}`);
    }
    async fetchGameDetail(gameSlug, gameId) {
        if (!/^[a-z0-9-]+$/i.test(gameSlug))
            return null;
        const safeSlug = gameSlug.toLowerCase();
        const safeId = encodeURIComponent(gameId);
        return this.fetchJson(`/${safeSlug}/games/${safeId}`);
    }
    async fetchPage(path, params) {
        if (!this.token)
            return [];
        const qs = new URLSearchParams();
        for (const [k, v] of Object.entries(params)) {
            qs.set(k, String(v));
        }
        const url = `${this.baseUrl}${path}?${qs.toString()}`;
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
        try {
            const res = await fetch(url, {
                signal: controller.signal,
                headers: {
                    Authorization: `Bearer ${this.token}`,
                    Accept: 'application/json',
                },
            });
            if (!res.ok) {
                const body = await res.text().catch(() => '');
                this.logger.warn(`PandaScore ${path} => HTTP ${res.status}: ${body.slice(0, 200)}`);
                return [];
            }
            const data = await res.json();
            return Array.isArray(data) ? data : [];
        }
        catch (e) {
            if (e?.name === 'AbortError') {
                this.logger.warn(`PandaScore ${path} timed out after ${this.timeoutMs}ms`);
            }
            else {
                this.logger.warn(`PandaScore ${path} fetch error: ${String(e?.message ?? e)}`);
            }
            return [];
        }
        finally {
            clearTimeout(timeout);
        }
    }
    async fetchJson(path) {
        if (!this.token)
            return null;
        const url = `${this.baseUrl}${path}`;
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
        try {
            const res = await fetch(url, {
                signal: controller.signal,
                headers: {
                    Authorization: `Bearer ${this.token}`,
                    Accept: 'application/json',
                },
            });
            if (!res.ok) {
                const body = await res.text().catch(() => '');
                this.logger.warn(`PandaScore ${path} => HTTP ${res.status}: ${body.slice(0, 200)}`);
                return null;
            }
            return (await res.json());
        }
        catch (e) {
            if (e?.name === 'AbortError') {
                this.logger.warn(`PandaScore ${path} timed out after ${this.timeoutMs}ms`);
            }
            else {
                this.logger.warn(`PandaScore ${path} fetch error: ${String(e?.message ?? e)}`);
            }
            return null;
        }
        finally {
            clearTimeout(timeout);
        }
    }
};
exports.PandaScoreService = PandaScoreService;
exports.PandaScoreService = PandaScoreService = PandaScoreService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], PandaScoreService);
//# sourceMappingURL=pandascore.service.js.map