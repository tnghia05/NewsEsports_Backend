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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var MatchSyncWorkerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MatchSyncWorkerService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const mongoose_1 = require("@nestjs/mongoose");
const match_model_1 = require("../models/match.model");
const pandascore_service_1 = require("../infra/pandascore/pandascore.service");
let MatchSyncWorkerService = MatchSyncWorkerService_1 = class MatchSyncWorkerService {
    config;
    matchModel;
    pandaScore;
    logger = new common_1.Logger(MatchSyncWorkerService_1.name);
    timer;
    running = false;
    intervalMs;
    provider;
    constructor(config, matchModel, pandaScore) {
        this.config = config;
        this.matchModel = matchModel;
        this.pandaScore = pandaScore;
        this.intervalMs = Number(this.config.get('MATCH_SYNC_INTERVAL_MS') ?? 5 * 60_000);
        this.provider = (this.config.get('MATCH_DATA_PROVIDER') ?? 'pandascore').toLowerCase();
    }
    onModuleInit() {
        this.timer = setInterval(() => void this.tick(), this.intervalMs);
        void this.tick();
    }
    onModuleDestroy() {
        if (this.timer)
            clearInterval(this.timer);
    }
    async syncNow() {
        return this.runSync();
    }
    async tick() {
        if (this.running)
            return;
        this.running = true;
        try {
            await this.runSync();
        }
        finally {
            this.running = false;
        }
    }
    async runSync() {
        const started = Date.now();
        let upserted = 0;
        try {
            const matches = this.provider === 'mock'
                ? buildMockMatches()
                : await this.fetchFromPandaScore();
            for (const m of matches) {
                await this.matchModel
                    .findOneAndUpdate({ externalId: m.externalId }, { $set: { ...m, syncedAt: new Date() } }, { upsert: true, new: true })
                    .exec();
                upserted++;
            }
        }
        catch (e) {
            this.logger.error(`Match sync failed: ${String(e?.message ?? e)}`);
            return { ok: false, error: String(e?.message ?? e) };
        }
        const elapsed = Date.now() - started;
        this.logger.log(`Match sync done in ${elapsed}ms provider=${this.provider} upserted=${upserted}`);
        return { ok: true, upserted, provider: this.provider };
    }
    async fetchFromPandaScore() {
        if (!this.pandaScore.isConfigured) {
            this.logger.warn('PANDASCORE_TOKEN not set — skipping sync. Set MATCH_DATA_PROVIDER=mock for dev.');
            return [];
        }
        const [running, upcoming, past] = await Promise.all([
            this.pandaScore.fetchRunningMatches(50),
            this.pandaScore.fetchUpcomingMatches(50),
            this.pandaScore.fetchPastMatches(50),
        ]);
        const all = [...running, ...upcoming, ...past];
        const seen = new Set();
        const deduped = [];
        for (const m of all) {
            const key = String(m.id);
            if (!seen.has(key)) {
                seen.add(key);
                deduped.push(m);
            }
        }
        return deduped.map(mapPandaScoreMatch);
    }
};
exports.MatchSyncWorkerService = MatchSyncWorkerService;
exports.MatchSyncWorkerService = MatchSyncWorkerService = MatchSyncWorkerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, mongoose_1.InjectModel)(match_model_1.MatchModelName)),
    __metadata("design:paramtypes", [config_1.ConfigService, Function, pandascore_service_1.PandaScoreService])
], MatchSyncWorkerService);
function mapPandaScoreMatch(m) {
    const statusMap = {
        running: 'live',
        not_started: 'not_started',
        finished: 'finished',
        canceled: 'finished',
        postponed: 'not_started',
    };
    const teams = (m.opponents ?? [])
        .filter((o) => o.type === 'Team')
        .map((o) => {
        const team = o.opponent;
        const result = m.results?.find((r) => r.team_id === team.id);
        return {
            name: team.name,
            acronym: team.acronym ?? undefined,
            imageUrl: team.image_url ?? undefined,
            score: result?.score,
            externalId: team.id,
        };
    });
    const startsAt = m.scheduled_at
        ? new Date(m.scheduled_at)
        : m.begin_at
            ? new Date(m.begin_at)
            : undefined;
    return {
        externalId: String(m.id),
        game: normalizeGame(m.videogame?.slug),
        region: m.league?.slug ?? undefined,
        status: statusMap[m.status] ?? 'not_started',
        startsAt,
        teams,
        matchName: m.name ?? undefined,
        tournamentName: m.tournament?.name ?? undefined,
        leagueName: m.league?.name ?? undefined,
        serieName: m.serie?.name ?? undefined,
        numberOfGames: m.number_of_games ?? undefined,
        endedAt: m.end_at ? new Date(m.end_at) : undefined,
        provider: 'pandascore',
        syncedAt: new Date(),
    };
}
function normalizeGame(slug) {
    if (!slug)
        return 'unknown';
    const map = {
        'league-of-legends': 'lol',
        'cs-go': 'csgo',
        'counter-strike': 'csgo',
        'dota-2': 'dota2',
        valorant: 'valorant',
        'overwatch-2': 'ow2',
        'rocket-league': 'rl',
        'mobile-legends': 'mlbb',
        'king-of-glory': 'kog',
        'rainbow-six': 'r6',
        'call-of-duty': 'cod',
    };
    return map[slug] ?? slug;
}
function buildMockMatches() {
    const now = new Date();
    const in1h = (h) => new Date(now.getTime() + h * 3_600_000);
    const ago = (h) => new Date(now.getTime() - h * 3_600_000);
    return [
        {
            externalId: 'mock-live-1',
            game: 'lol',
            region: 'lck',
            provider: 'mock',
            status: 'live',
            startsAt: ago(0.5),
            teams: [
                { name: 'T1', acronym: 'T1', score: 2, externalId: 1 },
                { name: 'Gen.G', acronym: 'GEN', score: 1, externalId: 2 },
            ],
            matchName: 'T1 vs Gen.G',
            tournamentName: 'LCK Spring 2025 Playoffs',
            leagueName: 'LCK',
            serieName: 'Spring 2025',
            numberOfGames: 5,
            syncedAt: now,
        },
        {
            externalId: 'mock-live-2',
            game: 'valorant',
            region: 'vct-pacific',
            provider: 'mock',
            status: 'live',
            startsAt: ago(0.25),
            teams: [
                { name: 'Paper Rex', acronym: 'PRX', score: 1, externalId: 3 },
                { name: 'Team Liquid', acronym: 'TL', score: 0, externalId: 4 },
            ],
            matchName: 'PRX vs TL',
            tournamentName: 'VCT Pacific 2025',
            leagueName: 'VCT Pacific',
            numberOfGames: 3,
            syncedAt: now,
        },
        {
            externalId: 'mock-upcoming-1',
            game: 'lol',
            region: 'lcs',
            provider: 'mock',
            status: 'not_started',
            startsAt: in1h(2),
            teams: [
                { name: 'Cloud9', acronym: 'C9', externalId: 5 },
                { name: '100 Thieves', acronym: '100T', externalId: 6 },
            ],
            matchName: 'C9 vs 100T',
            tournamentName: 'LCS Spring 2025',
            leagueName: 'LCS',
            numberOfGames: 3,
            syncedAt: now,
        },
        {
            externalId: 'mock-upcoming-2',
            game: 'csgo',
            region: 'esl-pro-league',
            provider: 'mock',
            status: 'not_started',
            startsAt: in1h(5),
            teams: [
                { name: 'Natus Vincere', acronym: 'NAVI', externalId: 7 },
                { name: 'FaZe Clan', acronym: 'FaZe', externalId: 8 },
            ],
            matchName: 'NAVI vs FaZe',
            tournamentName: 'ESL Pro League S21',
            leagueName: 'ESL Pro League',
            numberOfGames: 3,
            syncedAt: now,
        },
        {
            externalId: 'mock-upcoming-3',
            game: 'lol',
            region: 'vcs',
            provider: 'mock',
            status: 'not_started',
            startsAt: in1h(8),
            teams: [
                { name: 'GAM Esports', acronym: 'GAM', externalId: 9 },
                { name: 'Saigon Buffalo', acronym: 'SGB', externalId: 10 },
            ],
            matchName: 'GAM vs SGB',
            tournamentName: 'VCS Spring 2025',
            leagueName: 'VCS',
            numberOfGames: 3,
            syncedAt: now,
        },
        {
            externalId: 'mock-upcoming-4',
            game: 'dota2',
            region: 'dpc-eeu',
            provider: 'mock',
            status: 'not_started',
            startsAt: in1h(12),
            teams: [
                { name: 'Team Spirit', acronym: 'TS', externalId: 11 },
                { name: 'BetBoom', acronym: 'BB', externalId: 12 },
            ],
            matchName: 'Team Spirit vs BetBoom',
            tournamentName: 'DPC EEU 2025',
            leagueName: 'DPC EEU',
            numberOfGames: 3,
            syncedAt: now,
        },
        {
            externalId: 'mock-finished-1',
            game: 'lol',
            region: 'lck',
            provider: 'mock',
            status: 'finished',
            startsAt: ago(3),
            teams: [
                { name: 'KT Rolster', acronym: 'KT', score: 3, externalId: 13 },
                { name: 'DRX', acronym: 'DRX', score: 1, externalId: 14 },
            ],
            matchName: 'KT vs DRX',
            tournamentName: 'LCK Spring 2025 Playoffs',
            leagueName: 'LCK',
            numberOfGames: 5,
            syncedAt: now,
        },
        {
            externalId: 'mock-finished-2',
            game: 'valorant',
            region: 'vct-emea',
            provider: 'mock',
            status: 'finished',
            startsAt: ago(6),
            teams: [
                { name: 'Fnatic', acronym: 'FNC', score: 2, externalId: 15 },
                { name: 'NaVi', acronym: 'NAVI', score: 0, externalId: 16 },
            ],
            matchName: 'Fnatic vs NaVi',
            tournamentName: 'VCT EMEA 2025',
            leagueName: 'VCT EMEA',
            numberOfGames: 3,
            syncedAt: now,
        },
        {
            externalId: 'mock-finished-3',
            game: 'csgo',
            region: 'blast-premier',
            provider: 'mock',
            status: 'finished',
            startsAt: ago(10),
            teams: [
                { name: 'G2 Esports', acronym: 'G2', score: 2, externalId: 17 },
                { name: 'Virtus.pro', acronym: 'VP', score: 1, externalId: 18 },
            ],
            matchName: 'G2 vs Virtus.pro',
            tournamentName: 'BLAST Premier Spring 2025',
            leagueName: 'BLAST Premier',
            numberOfGames: 3,
            syncedAt: now,
        },
    ];
}
//# sourceMappingURL=match-sync-worker.service.js.map