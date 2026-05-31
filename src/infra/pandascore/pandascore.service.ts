import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface PandaScoreTeam {
  id: number;
  name: string;
  acronym?: string;
  image_url?: string;
}

export interface PandaScoreLeague {
  id: number;
  name: string;
  slug: string;
  url?: string;
  image_url?: string;
  videogame?: { id: number; name: string; slug: string };
  series?: PandaScoreSerie[];
}

export interface PandaScoreSerie {
  id: number;
  name?: string;
  full_name: string;
  slug: string;
  begin_at?: string;
  end_at?: string;
  year?: number;
  season?: string;
  winner_id?: number;
  winner_type?: string;
  league?: { id: number; name: string; slug: string; image_url?: string };
  league_id?: number;
  videogame?: { id: number; name: string; slug: string };
  tournaments?: PandaScoreTournament[];
}

export interface PandaScoreTournament {
  id: number;
  name: string;
  slug: string;
  begin_at?: string;
  end_at?: string;
  league?: { id: number; name: string; slug: string };
  league_id?: number;
  serie_id?: number;
  videogame?: { id: number; name: string; slug: string };
  prizepool?: string;
  tier?: string;
}

export interface PandaScoreStanding {
  rank: number;
  team: PandaScoreTeam;
  wins: number;
  losses: number;
  draws: number;
  total: number;
}

export interface PandaScorePlayer {
  id: number;
  name: string;
  first_name?: string;
  last_name?: string;
  image_url?: string;
  nationality?: string;
  role?: string;
  age?: number;
  hometown?: string;
}

export interface PandaScoreRoster {
  team: PandaScoreTeam;
  players: PandaScorePlayer[];
}

export interface PandaScoreMatch {
  id: number;
  name: string;
  status: 'not_started' | 'running' | 'finished' | 'canceled' | 'postponed';
  scheduled_at?: string;
  begin_at?: string;
  end_at?: string;
  videogame?: { id: number; name: string; slug: string };
  tournament?: { id: number; name: string; slug: string };
  league?: { id: number; name: string; slug: string };
  serie?: { id: number; name: string; slug: string };
  opponents?: Array<{ opponent: PandaScoreTeam; type: string }>;
  results?: Array<{ team_id: number; score: number }>;
  number_of_games?: number;
}

@Injectable()
export class PandaScoreService {
  private readonly logger = new Logger(PandaScoreService.name);
  private readonly baseUrl = 'https://api.pandascore.co';
  private readonly timeoutMs = 15_000;

  private readonly token: string;

  constructor(private readonly config: ConfigService) {
    this.token = this.config.get<string>('PANDASCORE_TOKEN') ?? '';
  }

  get isConfigured(): boolean {
    return Boolean(this.token);
  }

  async fetchRunningMatches(perPage = 50): Promise<PandaScoreMatch[]> {
    return this.fetchPage('/matches/running', { per_page: perPage, sort: '-begin_at' });
  }

  async fetchUpcomingMatches(perPage = 50): Promise<PandaScoreMatch[]> {
    const now = new Date();
    const in7days = new Date(now.getTime() + 7 * 24 * 60 * 60_000);
    return this.fetchPage('/matches/upcoming', {
      per_page: perPage,
      sort: 'scheduled_at',
      'range[scheduled_at]': `${now.toISOString()},${in7days.toISOString()}`,
    });
  }

  async fetchPastMatches(perPage = 50): Promise<PandaScoreMatch[]> {
    const now = new Date();
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60_000);
    return this.fetchPage('/matches/past', {
      per_page: perPage,
      sort: '-begin_at',
      'range[begin_at]': `${twoDaysAgo.toISOString()},${now.toISOString()}`,
    });
  }

  /**
   * Fetch a single match (raw PandaScore response) by ID or slug.
   * This is intended for "match detail" pages where you need all fields
   * PandaScore exposes (games, results, streams, etc.).
   */
  async fetchMatchDetail(matchIdOrSlug: string): Promise<unknown | null> {
    const safe = encodeURIComponent(matchIdOrSlug);
    return this.fetchJson(`/matches/${safe}`);
  }

  /**
   * Fetch a match's opponents (raw PandaScore response) by match ID or slug.
   */
  async fetchMatchOpponents(matchIdOrSlug: string): Promise<unknown | null> {
    const safe = encodeURIComponent(matchIdOrSlug);
    return this.fetchJson(`/matches/${safe}/opponents`);
  }

  /**
   * LoL detailed game stats (KDA/gold/damage...). Requires PandaScore plan support.
   */
  async fetchLoLGame(gameId: string): Promise<unknown | null> {
    const safe = encodeURIComponent(gameId);
    return this.fetchJson(`/lol/games/${safe}`);
  }

  // ── Leagues ──────────────────────────────────────────────────────────────

  async fetchLeagues(videogame?: string): Promise<PandaScoreLeague[]> {
    const params: Record<string, string | number> = { per_page: 100, sort: 'name' };
    if (videogame) params['filter[videogame]'] = videogame;
    return this.fetchList<PandaScoreLeague>('/leagues', params);
  }

  // ── Series ───────────────────────────────────────────────────────────────

  async fetchRunningSeries(videogame?: string): Promise<PandaScoreSerie[]> {
    const params: Record<string, string | number> = { per_page: 50, sort: '-begin_at' };
    if (videogame) params['filter[videogame]'] = videogame;
    return this.fetchList<PandaScoreSerie>('/series/running', params);
  }

  async fetchUpcomingSeries(videogame?: string): Promise<PandaScoreSerie[]> {
    const params: Record<string, string | number> = { per_page: 50, sort: 'begin_at' };
    if (videogame) params['filter[videogame]'] = videogame;
    return this.fetchList<PandaScoreSerie>('/series/upcoming', params);
  }

  async fetchPastSeries(videogame?: string): Promise<PandaScoreSerie[]> {
    const params: Record<string, string | number> = { per_page: 50, sort: '-end_at' };
    if (videogame) params['filter[videogame]'] = videogame;
    return this.fetchList<PandaScoreSerie>('/series/past', params);
  }

  async fetchSerieDetail(slug: string): Promise<unknown | null> {
    const safe = encodeURIComponent(slug);
    return this.fetchJson(`/series/${safe}`);
  }

  async fetchSerieMatches(
    slug: string,
    status?: 'running' | 'upcoming' | 'past',
  ): Promise<PandaScoreMatch[]> {
    const safe = encodeURIComponent(slug);
    const path = status ? `/series/${safe}/matches/${status}` : `/series/${safe}/matches`;
    return this.fetchList<PandaScoreMatch>(path, { per_page: 100, sort: 'scheduled_at' });
  }

  // ── Tournaments ───────────────────────────────────────────────────────────

  async fetchRunningTournaments(videogame?: string): Promise<PandaScoreTournament[]> {
    const params: Record<string, string | number> = { per_page: 50, sort: '-begin_at' };
    if (videogame) params['filter[videogame]'] = videogame;
    return this.fetchList<PandaScoreTournament>('/tournaments/running', params);
  }

  async fetchTournamentStandings(tournamentId: string): Promise<PandaScoreStanding[]> {
    const safe = encodeURIComponent(tournamentId);
    return this.fetchList<PandaScoreStanding>(`/tournaments/${safe}/standings`, { per_page: 50 });
  }

  async fetchTournamentTeams(tournamentId: string): Promise<PandaScoreTeam[]> {
    const safe = encodeURIComponent(tournamentId);
    return this.fetchList<PandaScoreTeam>(`/tournaments/${safe}/teams`, { per_page: 50 });
  }

  async fetchTournamentRosters(tournamentId: string): Promise<PandaScoreRoster[]> {
    const safe = encodeURIComponent(tournamentId);
    return this.fetchList<PandaScoreRoster>(`/tournaments/${safe}/rosters`, { per_page: 50 });
  }

  async fetchGameDetail(gameSlug: string, gameId: string): Promise<unknown | null> {
    // Defensive: only allow simple slugs to avoid path tricks.
    // Examples: lol, csgo, dota2, valorant, ow2, rl, mlbb, cod-mw...
    if (!/^[a-z0-9-]+$/i.test(gameSlug)) return null;
    const safeSlug = gameSlug.toLowerCase();
    const safeId = encodeURIComponent(gameId);
    return this.fetchJson(`/${safeSlug}/games/${safeId}`);
  }

  /** Generic list fetcher — replaces the old PandaScoreMatch-typed fetchPage */
  private async fetchList<T>(
    path: string,
    params: Record<string, string | number> = {},
  ): Promise<T[]> {
    if (!this.token) return [];

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
        this.logger.warn(
          `PandaScore ${path} => HTTP ${res.status}: ${body.slice(0, 200)}`,
        );
        return [];
      }

      const data: unknown = await res.json();
      return Array.isArray(data) ? (data as T[]) : [];
    } catch (e: any) {
      if (e?.name === 'AbortError') {
        this.logger.warn(`PandaScore ${path} timed out after ${this.timeoutMs}ms`);
      } else {
        this.logger.warn(`PandaScore ${path} fetch error: ${String(e?.message ?? e)}`);
      }
      return [];
    } finally {
      clearTimeout(timeout);
    }
  }

  /** @deprecated use fetchList<PandaScoreMatch> instead */
  private async fetchPage(
    path: string,
    params: Record<string, string | number>,
  ): Promise<PandaScoreMatch[]> {
    return this.fetchList<PandaScoreMatch>(path, params);
  }

  private async fetchJson(path: string): Promise<unknown | null> {
    if (!this.token) return null;

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
        this.logger.warn(
          `PandaScore ${path} => HTTP ${res.status}: ${body.slice(0, 200)}`,
        );
        return null;
      }

      return (await res.json()) as unknown;
    } catch (e: any) {
      if (e?.name === 'AbortError') {
        this.logger.warn(`PandaScore ${path} timed out after ${this.timeoutMs}ms`);
      } else {
        this.logger.warn(`PandaScore ${path} fetch error: ${String(e?.message ?? e)}`);
      }
      return null;
    } finally {
      clearTimeout(timeout);
    }
  }
}
