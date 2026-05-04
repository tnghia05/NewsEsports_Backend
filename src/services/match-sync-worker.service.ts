import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import {
  MatchModelName,
  type MatchDocument,
  type MatchStatus,
} from '../models/match.model';
import {
  PandaScoreService,
  type PandaScoreMatch,
} from '../infra/pandascore/pandascore.service';

@Injectable()
export class MatchSyncWorkerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MatchSyncWorkerService.name);
  private timer?: NodeJS.Timeout;
  private running = false;

  private readonly intervalMs: number;
  private readonly provider: string;

  constructor(
    private readonly config: ConfigService,
    @InjectModel(MatchModelName)
    private readonly matchModel: Model<MatchDocument>,
    private readonly pandaScore: PandaScoreService,
  ) {
    this.intervalMs = Number(
      this.config.get('MATCH_SYNC_INTERVAL_MS') ?? 5 * 60_000,
    );
    this.provider = (
      this.config.get<string>('MATCH_DATA_PROVIDER') ?? 'pandascore'
    ).toLowerCase();
  }

  onModuleInit() {
    this.timer = setInterval(() => void this.tick(), this.intervalMs);
    void this.tick();
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  async syncNow() {
    return this.runSync();
  }

  private async tick() {
    if (this.running) return;
    this.running = true;
    try {
      await this.runSync();
    } finally {
      this.running = false;
    }
  }

  private async runSync() {
    const started = Date.now();
    let upserted = 0;

    try {
      const matches =
        this.provider === 'mock'
          ? buildMockMatches()
          : await this.fetchFromPandaScore();

      for (const m of matches) {
        await this.matchModel
          .findOneAndUpdate(
            { externalId: m.externalId },
            { $set: { ...m, syncedAt: new Date() } },
            { upsert: true, new: true },
          )
          .exec();
        upserted++;
      }
    } catch (e: any) {
      this.logger.error(`Match sync failed: ${String(e?.message ?? e)}`);
      return { ok: false, error: String(e?.message ?? e) };
    }

    const elapsed = Date.now() - started;
    this.logger.log(
      `Match sync done in ${elapsed}ms provider=${this.provider} upserted=${upserted}`,
    );
    return { ok: true, upserted, provider: this.provider };
  }

  private async fetchFromPandaScore() {
    if (!this.pandaScore.isConfigured) {
      this.logger.warn(
        'PANDASCORE_TOKEN not set — skipping sync. Set MATCH_DATA_PROVIDER=mock for dev.',
      );
      return [];
    }

    const [running, upcoming, past] = await Promise.all([
      this.pandaScore.fetchRunningMatches(50),
      this.pandaScore.fetchUpcomingMatches(50),
      this.pandaScore.fetchPastMatches(50),
    ]);

    const all = [...running, ...upcoming, ...past];
    const seen = new Set<string>();
    const deduped: PandaScoreMatch[] = [];
    for (const m of all) {
      const key = String(m.id);
      if (!seen.has(key)) {
        seen.add(key);
        deduped.push(m);
      }
    }

    return deduped.map(mapPandaScoreMatch);
  }
}

// ---------- PandaScore mapping ----------

function mapPandaScoreMatch(m: PandaScoreMatch): Partial<MatchDocument> {
  const statusMap: Record<string, MatchStatus> = {
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
  } as any;
}

function normalizeGame(slug?: string): string {
  if (!slug) return 'unknown';
  const map: Record<string, string> = {
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

// ---------- Mock data (MATCH_DATA_PROVIDER=mock) ----------

function buildMockMatches() {
  const now = new Date();
  const in1h = (h: number) => new Date(now.getTime() + h * 3_600_000);
  const ago = (h: number) => new Date(now.getTime() - h * 3_600_000);

  return [
    // Live
    {
      externalId: 'mock-live-1',
      game: 'lol',
      region: 'lck',
      provider: 'mock',
      status: 'live' as MatchStatus,
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
      status: 'live' as MatchStatus,
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
    // Upcoming
    {
      externalId: 'mock-upcoming-1',
      game: 'lol',
      region: 'lcs',
      provider: 'mock',
      status: 'not_started' as MatchStatus,
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
      status: 'not_started' as MatchStatus,
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
      status: 'not_started' as MatchStatus,
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
      status: 'not_started' as MatchStatus,
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
    // Finished
    {
      externalId: 'mock-finished-1',
      game: 'lol',
      region: 'lck',
      provider: 'mock',
      status: 'finished' as MatchStatus,
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
      status: 'finished' as MatchStatus,
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
      status: 'finished' as MatchStatus,
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
