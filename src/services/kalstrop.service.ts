import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';

const KALSTROP_BASE = 'https://sportsapi.kalstropservice.com/odds_v1/v1';

export interface KalstropTeam {
  id: string;
  name: string;
  logoUrl?: string;
  oddsDecimal?: number;
  oddsNumerator?: number;
  oddsDenominator?: number;
  probability?: number;
}

export interface KalstropFixture {
  id: string;
  slug: string;
  name: string;
  startTime: string;
  status: 'LIVE' | 'PREMATCH' | 'FINISHED';
  competition: string;
  competitionSlug: string;
  category: string;
  teams: [KalstropTeam, KalstropTeam];
}

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const CACHE_TTL: Record<string, number> = {
  live: 30_000,       // 30s — live matches update frequently
  upcoming: 120_000,  // 2min — upcoming matches rarely change
  popular: 120_000,
};

@Injectable()
export class KalstropService {
  private readonly logger = new Logger(KalstropService.name);
  private readonly cache = new Map<string, CacheEntry<any>>();

  private getCached<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    return entry.data as T;
  }

  private setCache<T>(key: string, data: T, ttlMs: number): void {
    this.cache.set(key, { data, expiresAt: Date.now() + ttlMs });
  }

  private getHeaders(): Record<string, string> {
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

  private async fetchApi<T>(path: string): Promise<T | null> {
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
      return (await res.json()) as T;
    } catch (err) {
      this.logger.error(`Kalstrop fetch error: ${err}`);
      return null;
    }
  }

  private parseDecimalOdds(numerator: string, denominator: string): number {
    const n = parseInt(numerator ?? '0', 10);
    const d = parseInt(denominator ?? '100', 10);
    if (d === 0) return 0;
    return Math.round(((n / d) + 1) * 100) / 100;
  }

  private transformFixtures(data: any, competitionName: string, competitionSlug: string, category: string): KalstropFixture[] {
    const fixtures: KalstropFixture[] = [];
    const nodes: any[] = data?.fixtures?.nodes ?? data?.nodes ?? [];

    for (const f of nodes) {
      const competitors: any[] = f?.competitors ?? [];
      const defaultOdds: any[] = f?.defaultMarketsInfo?.defaultMarket?.odds ?? [];
      const eventState: string = f?.matchState?.matchSummary?.eventState ?? 'PREMATCH';

      const status: KalstropFixture['status'] =
        eventState === 'LIVE' || eventState === 'IN_PROGRESS' ? 'LIVE'
        : eventState === 'FINISHED' || eventState === 'ENDED' ? 'FINISHED'
        : 'PREMATCH';

      const teamA = competitors[0];
      const teamB = competitors[1];
      if (!teamA || !teamB) continue;

      const oddsA = defaultOdds[0];
      const oddsB = defaultOdds[1];

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
      });
    }

    return fixtures;
  }

  async getFixtures(sport: string, type: 'live' | 'upcoming' | 'popular'): Promise<KalstropFixture[]> {
    const cacheKey = `${sport}-${type}`;
    const cached = this.getCached<KalstropFixture[]>(cacheKey);
    if (cached) {
      this.logger.debug(`Cache hit: ${cacheKey}`);
      return cached;
    }

    const data = await this.fetchApi<any>(`/sports/${sport}/${type}`);
    if (!data) return [];

    const competitions: any[] =
      data?.sportsCompetitions?.nodes ?? data?.nodes ?? [];

    const result: KalstropFixture[] = [];
    for (const comp of competitions) {
      const compName: string = comp?.name ?? comp?.slug ?? 'Unknown';
      const compSlug: string = comp?.slug ?? '';
      const category: string = comp?.category?.slug ?? '';
      const fixtures = this.transformFixtures(comp, compName, compSlug, category);
      result.push(...fixtures);
    }

    this.setCache(cacheKey, result, CACHE_TTL[type] ?? 60_000);
    this.logger.debug(`Kalstrop API call: ${sport}/${type} → ${result.length} fixtures cached`);
    return result;
  }

  async getFixtureDetails(fixtureId: string, group = 'TOP_MARKETS'): Promise<any> {
    return this.fetchApi(`/fixture/${fixtureId}/details?group=${encodeURIComponent(group)}`);
  }

  async getFixtureSsrGroups(sport: string, category: string, tournament: string, fixture: string): Promise<any> {
    const params = new URLSearchParams({ sport, category, tournament, fixture });
    return this.fetchApi(`/fixture/ssr/groups?${params}`);
  }
}
