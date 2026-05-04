import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface PandaScoreTeam {
  id: number;
  name: string;
  acronym?: string;
  image_url?: string;
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

  private async fetchPage(
    path: string,
    params: Record<string, string | number>,
  ): Promise<PandaScoreMatch[]> {
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
      return Array.isArray(data) ? (data as PandaScoreMatch[]) : [];
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
}
