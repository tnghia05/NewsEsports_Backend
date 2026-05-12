"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var KalstropService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.KalstropService = void 0;
const common_1 = require("@nestjs/common");
const crypto = __importStar(require("crypto"));
const KALSTROP_BASE = 'https://sportsapi.kalstropservice.com/odds_v1/v1';
const CACHE_TTL = {
    live: 300_000,
    upcoming: 1_800_000,
    popular: 1_800_000,
};
let KalstropService = KalstropService_1 = class KalstropService {
    logger = new common_1.Logger(KalstropService_1.name);
    cache = new Map();
    inFlight = new Map();
    minCallGapMs = 1100;
    throttleQueue = Promise.resolve();
    getCached(key) {
        const entry = this.cache.get(key);
        if (!entry)
            return null;
        if (Date.now() > entry.expiresAt) {
            this.cache.delete(key);
            return null;
        }
        return entry.data;
    }
    setCache(key, data, ttlMs) {
        this.cache.set(key, { data, expiresAt: Date.now() + ttlMs });
    }
    getHeaders() {
        const clientId = process.env.KALSTROP_CLIENT_ID ?? '';
        const secret = process.env.KALSTROP_SHARED_SECRET ?? '';
        const timestamp = Math.floor(Date.now() / 1000).toString();
        const hashedSecret = crypto.createHash('sha256').update(secret).digest('hex');
        const signature = crypto
            .createHmac('sha256', hashedSecret)
            .update(`${clientId}:${timestamp}`)
            .digest('hex');
        return {
            'X-Client-ID': clientId,
            'X-Timestamp': timestamp,
            Authorization: `Bearer ${signature}`,
            'Content-Type': 'application/json',
        };
    }
    lastCallAt = 0;
    throttle() {
        const prev = this.throttleQueue;
        this.throttleQueue = prev.then(() => new Promise(resolve => {
            const wait = this.minCallGapMs - (Date.now() - this.lastCallAt);
            const fire = () => { this.lastCallAt = Date.now(); resolve(); };
            wait > 0 ? setTimeout(fire, wait) : fire();
        }));
        return this.throttleQueue;
    }
    async fetchApi(path) {
        await this.throttle();
        try {
            const res = await fetch(`${KALSTROP_BASE}${path}`, {
                headers: this.getHeaders(),
            });
            if (!res.ok) {
                const body = await res.text().catch(() => '');
                this.logger.warn(`Kalstrop ${path} → ${res.status}: ${body.slice(0, 200)}`);
                if (res.status === 401) {
                    const id = process.env.KALSTROP_CLIENT_ID;
                    this.logger.warn(`AUTH DEBUG: CLIENT_ID set=${!!id && id.length > 0}`);
                }
                return null;
            }
            return (await res.json());
        }
        catch (err) {
            this.logger.error(`Kalstrop fetch error: ${err}`);
            return null;
        }
    }
    parseDecimalOdds(numerator, denominator) {
        const n = parseInt(numerator ?? '0', 10);
        const d = parseInt(denominator ?? '100', 10);
        if (d === 0)
            return 0;
        return Math.round(((n / d) + 1) * 100) / 100;
    }
    extractOddsFromCompetitor(competitor, fixture) {
        if (competitor.odds !== undefined)
            return { decimal: parseFloat(competitor.odds), probability: competitor.probability };
        if (competitor.winOdds !== undefined)
            return { decimal: parseFloat(competitor.winOdds) };
        if (competitor.decimalOdds !== undefined)
            return { decimal: parseFloat(competitor.decimalOdds), probability: competitor.probability };
        const defaultMarket = fixture?.defaultMarketsInfo?.defaultMarket?.odds?.[0];
        if (defaultMarket) {
            const sels = defaultMarket.selections ?? [];
            const idx = (fixture?.competitors ?? []).indexOf(competitor);
            const selIdx = sels.length === 2 && idx >= 0 ? 1 - idx : idx;
            const sel = selIdx >= 0 ? sels[selIdx] : null;
            if (sel) {
                const decimal = sel.price ?? sel.odds ?? sel.decimalOdds
                    ?? (sel.oddsNumerator ? this.parseDecimalOdds(sel.oddsNumerator, sel.oddsDenominator) : undefined);
                return {
                    decimal: decimal != null ? parseFloat(String(decimal)) : undefined,
                    probability: sel.probability ? parseFloat(sel.probability) : undefined,
                };
            }
        }
        return {};
    }
    transformFixtures(data, competitionName, competitionSlug, category) {
        const fixtures = [];
        const nodes = data?.fixtures?.nodes ?? data?.nodes ?? [];
        for (const f of nodes) {
            const competitors = f?.competitors ?? [];
            const defaultOdds = f?.defaultMarketsInfo?.defaultMarket?.odds ?? [];
            const eventState = f?.matchState?.matchSummary?.eventState ?? 'PREMATCH';
            const status = eventState === 'LIVE' || eventState === 'IN_PROGRESS' ? 'LIVE'
                : eventState === 'FINISHED' || eventState === 'ENDED' ? 'FINISHED'
                    : 'PREMATCH';
            const teamA = competitors[0];
            const teamB = competitors[1];
            if (!teamA || !teamB)
                continue;
            const oddsA = defaultOdds[0];
            const oddsB = defaultOdds[1];
            const defaultMarketId = f?.defaultMarketsInfo?.defaultMarket?.odds?.[0]?.marketId
                ?? f?.defaultMarketsInfo?.defaultMarket?.id
                ?? undefined;
            fixtures.push({
                id: f.id ?? '',
                slug: f.slug ?? '',
                name: f.name ?? `${teamA.name} vs ${teamB.name}`,
                startTime: f.startTime ?? f.startTimeScheduled ?? '',
                status,
                competition: competitionName,
                competitionSlug,
                category,
                teams: [
                    {
                        id: teamA.id ?? '',
                        name: teamA.name ?? 'TBD',
                        logoUrl: teamA.iconPath
                            ? `${KALSTROP_BASE}/api/v1/assets/esports-logo/${teamA.iconPath}`
                            : undefined,
                        oddsDecimal: oddsA ? this.parseDecimalOdds(oddsA.oddsNumerator, oddsA.oddsDenominator) : undefined,
                        oddsNumerator: oddsA ? parseInt(oddsA.oddsNumerator) : undefined,
                        oddsDenominator: oddsA ? parseInt(oddsA.oddsDenominator) : undefined,
                        probability: oddsA ? parseFloat(oddsA.probability ?? '0') : undefined,
                    },
                    {
                        id: teamB.id ?? '',
                        name: teamB.name ?? 'TBD',
                        logoUrl: teamB.iconPath
                            ? `${KALSTROP_BASE}/api/v1/assets/esports-logo/${teamB.iconPath}`
                            : undefined,
                        oddsDecimal: oddsB ? this.parseDecimalOdds(oddsB.oddsNumerator, oddsB.oddsDenominator) : undefined,
                        oddsNumerator: oddsB ? parseInt(oddsB.oddsNumerator) : undefined,
                        oddsDenominator: oddsB ? parseInt(oddsB.oddsDenominator) : undefined,
                        probability: oddsB ? parseFloat(oddsB.probability ?? '0') : undefined,
                    },
                ],
                defaultMarketId,
            });
        }
        return fixtures;
    }
    async fetchFixturesUncached(sport, type, cacheKey) {
        const pageSize = type === 'live' ? 10 : 100;
        const data = await this.fetchApi(`/sports/${sport}/${type}?first=${pageSize}`);
        if (!data)
            return [];
        let nodes = data?.sportsFixtures?.nodes ?? [];
        if (nodes.length === 0 && data?.sportsCompetitions?.nodes) {
            const comps = data.sportsCompetitions.nodes;
            for (const comp of comps) {
                const fixtureNodes = comp?.fixtures?.nodes ?? [];
                nodes.push(...fixtureNodes.map((f) => ({
                    ...f,
                    _competition: comp?.name ?? '',
                    _competitionSlug: comp?.slug ?? '',
                    _category: comp?.category?.slug ?? comp?.category?.sports?.toLowerCase() ?? sport,
                })));
            }
        }
        if (nodes.length > 0) {
            if (nodes[0]?.competition) {
                this.logger.debug(`Kalstrop competition field: ${JSON.stringify(nodes[0].competition).slice(0, 400)}`);
            }
        }
        const now = new Date();
        const result = nodes.map((f) => {
            const competitors = f.competitors ?? f.teams ?? [];
            const cA = competitors[0] ?? {};
            const cB = competitors[1] ?? {};
            const startTime = new Date(f.startTime ?? f.start_time ?? '');
            let status = 'PREMATCH';
            const rawStatus = (f.status ?? f.liveStatus ?? '').toUpperCase();
            if (rawStatus === 'LIVE' || rawStatus === 'IN_PROGRESS' || f.inPlay === true) {
                status = 'LIVE';
            }
            else if (startTime < now && !isNaN(startTime.getTime())) {
                status = 'FINISHED';
            }
            const oddsA = this.extractOddsFromCompetitor(cA, f);
            const oddsB = this.extractOddsFromCompetitor(cB, f);
            return {
                id: f.id ?? f.slug,
                slug: f.slug ?? f.id,
                name: f.name ?? f.shortName ?? '',
                startTime: f.startTime ?? f.start_time ?? '',
                status,
                competition: f._competition || (f.tournament?.name ?? f.competition?.name ?? f.sportCompetition?.name ?? sport.toUpperCase()),
                competitionSlug: f._competitionSlug || (f.tournament?.slug ?? f.competition?.slug ?? ''),
                category: f._category || (f.category?.slug ?? sport),
                preMatchWidgetUrl: f.preMatchWidget?.url ?? undefined,
                tournamentSlug: f.competition?.slug ?? f.tournament?.slug ?? undefined,
                categorySlug: f.competition?.category?.slug ?? f.competition?.sport?.slug ?? undefined,
                teams: [
                    {
                        id: cA.id ?? '',
                        name: cA.displayName ?? cA.name ?? 'TBD',
                        logoUrl: cA.iconPath ?? cA.logo ?? undefined,
                        oddsDecimal: oddsA.decimal,
                        probability: oddsA.probability,
                    },
                    {
                        id: cB.id ?? '',
                        name: cB.displayName ?? cB.name ?? 'TBD',
                        logoUrl: cB.iconPath ?? cB.logo ?? undefined,
                        oddsDecimal: oddsB.decimal,
                        probability: oddsB.probability,
                    },
                ],
            };
        });
        this.setCache(cacheKey, result, CACHE_TTL[type] ?? 60_000);
        this.logger.debug(`Kalstrop API call: ${sport}/${type} → ${result.length} fixtures cached`);
        return result;
    }
    async getFixtures(sport, type) {
        const cacheKey = `${sport}-${type}`;
        const cached = this.getCached(cacheKey);
        if (cached)
            return cached;
        if (this.inFlight.has(cacheKey)) {
            return this.inFlight.get(cacheKey);
        }
        const promise = this.fetchFixturesUncached(sport, type, cacheKey);
        this.inFlight.set(cacheKey, promise);
        promise.finally(() => this.inFlight.delete(cacheKey));
        return promise;
    }
    async getFixtureDetails(fixtureId, group = 'TOP_MARKETS') {
        const cacheKey = `details-${fixtureId}-${group}`;
        const cached = this.getCached(cacheKey);
        if (cached)
            return cached;
        const data = await this.fetchApi(`/fixture/${fixtureId}/details?group=${encodeURIComponent(group)}`);
        if (data) {
            this.logger.debug(`Kalstrop details keys [${fixtureId}]: ${Object.keys(data).join(', ')}`);
            const firstSel = data?.top_markets?.display?.[0]?.selectionGroups?.[0]?.selections?.[0];
            if (firstSel)
                this.logger.debug(`Kalstrop details first selection: ${JSON.stringify(firstSel)}`);
            this.setCache(cacheKey, data, 60_000);
        }
        return data;
    }
    extractWinnerOddsFromDetails(details) {
        const markets = details?.fixture?.defaultMarketsInfo?.defaultMarket?.odds
            ?? details?.defaultMarket?.odds
            ?? details?.markets?.nodes?.[0]?.odds
            ?? details?.odds
            ?? [];
        if (markets.length < 2)
            return null;
        const parse = (o) => ({
            decimal: o?.oddsDecimal ?? (o?.oddsNumerator != null ? this.parseDecimalOdds(o.oddsNumerator, o.oddsDenominator) : undefined),
            probability: o?.probability != null ? parseFloat(o.probability) : undefined,
        });
        return [parse(markets[0]), parse(markets[1])];
    }
    async getFixtureSsrGroups(sport, category, tournament, fixture) {
        const cacheKey = `ssr-${sport}-${fixture}`;
        const cached = this.getCached(cacheKey);
        if (cached)
            return cached;
        const params = new URLSearchParams({ sport, category, tournament, fixture });
        const data = await this.fetchApi(`/fixture/ssr/groups?${params}`);
        if (data) {
            this.logger.debug(`Kalstrop SSR keys [${fixture}]: ${Object.keys(data).join(', ')}`);
            this.setCache(cacheKey, data, 300_000);
        }
        return data;
    }
};
exports.KalstropService = KalstropService;
exports.KalstropService = KalstropService = KalstropService_1 = __decorate([
    (0, common_1.Injectable)()
], KalstropService);
//# sourceMappingURL=kalstrop.service.js.map