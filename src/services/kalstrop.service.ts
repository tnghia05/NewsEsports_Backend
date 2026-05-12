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
  preMatchWidgetUrl?: string;
  tournamentSlug?: string;
  categorySlug?: string;
  defaultMarketId?: string;
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
  private lastApiCallAt = 0;
  private readonly minCallGapMs = 600;  // 600ms between any two API calls

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

  private async throttle(): Promise<void> {
    const now = Date.now();
    const wait = this.minCallGapMs - (now - this.lastApiCallAt);
    if (wait > 0) await new Promise(r => setTimeout(r, wait));
    this.lastApiCallAt = Date.now();
  }

  private async fetchApi<T>(path: string): Promise<T | null> {
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

  private extractOddsFromCompetitor(competitor: any, fixture: any): { decimal?: number; probability?: number } {
    // Try competitor-level odds fields
    if (competitor.odds !== undefined) return { decimal: parseFloat(competitor.odds), probability: competitor.probability };
    if (competitor.winOdds !== undefined) return { decimal: parseFloat(competitor.winOdds) };
    if (competitor.decimalOdds !== undefined) return { decimal: parseFloat(competitor.decimalOdds), probability: competitor.probability };

    // Try fixture-level defaultMarketsInfo → odds[0].selections[competitorIdx]
    const defaultMarket = fixture?.defaultMarketsInfo?.defaultMarket?.odds?.[0];
    if (defaultMarket) {
      const sels: any[] = defaultMarket.selections ?? [];
      const idx = (fixture?.competitors ?? []).indexOf(competitor);
      // Kalstrop selections are [away, home] but competitors are [home, away] → swap
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
      const defaultMarketId: string | undefined = f?.defaultMarketsInfo?.defaultMarket?.odds?.[0]?.marketId
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

  async getFixtures(sport: string, type: 'live' | 'upcoming' | 'popular'): Promise<KalstropFixture[]> {
    const cacheKey = `${sport}-${type}`;
    const cached = this.getCached<KalstropFixture[]>(cacheKey);
    if (cached) {
      this.logger.debug(`Cache hit: ${cacheKey}`);
      return cached;
    }

    const pageSize = type === 'live' ? 10 : 30;
    const data = await this.fetchApi<any>(`/sports/${sport}/${type}?first=${pageSize}`);
    if (!data) return [];

    // upcoming → sportsFixtures.nodes (flat list)
    // live     → sportsCompetitions.nodes[].fixtures.nodes (grouped by competition)
    let nodes: any[] = data?.sportsFixtures?.nodes ?? [];
    if (nodes.length === 0 && data?.sportsCompetitions?.nodes) {
      const comps: any[] = data.sportsCompetitions.nodes;
      for (const comp of comps) {
        const fixtureNodes: any[] = comp?.fixtures?.nodes ?? [];
        nodes.push(...fixtureNodes.map((f: any) => ({
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
    const result: KalstropFixture[] = nodes.map((f: any) => {
      const competitors: any[] = f.competitors ?? f.teams ?? [];
      const cA = competitors[0] ?? {};
      const cB = competitors[1] ?? {};

      const startTime = new Date(f.startTime ?? f.start_time ?? '');
      let status: 'LIVE' | 'PREMATCH' | 'FINISHED' = 'PREMATCH';
      const rawStatus = (f.status ?? f.liveStatus ?? '').toUpperCase();
      if (rawStatus === 'LIVE' || rawStatus === 'IN_PROGRESS' || f.inPlay === true) {
        status = 'LIVE';
      } else if (startTime < now && !isNaN(startTime.getTime())) {
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
        ] as [KalstropTeam, KalstropTeam],
      };
    });

    // Odds are already embedded in defaultMarketsInfo — no extra API call needed

    this.setCache(cacheKey, result, CACHE_TTL[type] ?? 60_000);
    this.logger.debug(`Kalstrop API call: ${sport}/${type} → ${result.length} fixtures cached`);
    return result;
  }

  async getFixtureDetails(fixtureId: string, group = 'TOP_MARKETS'): Promise<any> {
    const cacheKey = `details-${fixtureId}-${group}`;
    const cached = this.getCached<any>(cacheKey);
    if (cached) return cached;
    const data = await this.fetchApi<any>(`/fixture/${fixtureId}/details?group=${encodeURIComponent(group)}`);
    if (data) {
      this.logger.debug(`Kalstrop details keys [${fixtureId}]: ${Object.keys(data).join(', ')}`);
      const firstSel = data?.top_markets?.display?.[0]?.selectionGroups?.[0]?.selections?.[0];
      if (firstSel) this.logger.debug(`Kalstrop details first selection: ${JSON.stringify(firstSel)}`);
      this.setCache(cacheKey, data, 60_000);
    }
    return data;
  }

  private extractWinnerOddsFromDetails(details: any): [{ decimal?: number; probability?: number }, { decimal?: number; probability?: number }] | null {
    const markets: any[] = details?.fixture?.defaultMarketsInfo?.defaultMarket?.odds
      ?? details?.defaultMarket?.odds
      ?? details?.markets?.nodes?.[0]?.odds
      ?? details?.odds
      ?? [];
    if (markets.length < 2) return null;
    const parse = (o: any) => ({
      decimal: o?.oddsDecimal ?? (o?.oddsNumerator != null ? this.parseDecimalOdds(o.oddsNumerator, o.oddsDenominator) : undefined),
      probability: o?.probability != null ? parseFloat(o.probability) : undefined,
    });
    return [parse(markets[0]), parse(markets[1])];
  }

  async getFixtureSsrGroups(sport: string, category: string, tournament: string, fixture: string): Promise<any> {
    const cacheKey = `ssr-${sport}-${fixture}`;
    const cached = this.getCached<any>(cacheKey);
    if (cached) return cached;
    const params = new URLSearchParams({ sport, category, tournament, fixture });
    const data = await this.fetchApi<any>(`/fixture/ssr/groups?${params}`);
    if (data) {
      this.logger.debug(`Kalstrop SSR keys [${fixture}]: ${Object.keys(data).join(', ')}`);
      this.setCache(cacheKey, data, 300_000); // 5min cache
    }
    return data;
  }
}
