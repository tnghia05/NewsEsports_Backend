import { Injectable, Logger } from '@nestjs/common';

const LOL_ESPORTS_API = 'https://esports-api.lolesports.com/persisted/gw';
const LIVE_STATS_API = 'https://feed.lolesports.com/livestats/v1';
const API_KEY = '0TvQnueqKa5mxJntVWt0w4LpLfEkrV1Ta8rQBb9Z';

const HEADERS = { 'x-api-key': API_KEY };

@Injectable()
export class LoLEsportsService {
  private readonly logger = new Logger(LoLEsportsService.name);

  private async fetchJson<T>(url: string, useApiKey = true): Promise<T> {
    const res = await fetch(url, {
      headers: useApiKey ? HEADERS : {},
    });
    if (!res.ok) {
      throw new Error(`LoLEsports API error ${res.status}: ${url}`);
    }
    const text = await res.text();
    if (!text || text.trim() === '') return null as T;
    return JSON.parse(text) as T;
  }

  async getLive(hl = 'vi-VN') {
    try {
      const data = await this.fetchJson<any>(
        `${LOL_ESPORTS_API}/getLive?hl=${hl}`,
      );
      const events: any[] = data?.data?.schedule?.events ?? [];
      return events.map((e) => this.mapEvent(e));
    } catch (err) {
      this.logger.warn(`getLive failed: ${err}`);
      return [];
    }
  }

  async getSchedule(hl = 'vi-VN', pageToken?: string) {
    try {
      let url = `${LOL_ESPORTS_API}/getSchedule?hl=${hl}`;
      if (pageToken) url += `&pageToken=${pageToken}`;
      const data = await this.fetchJson<any>(url);
      const events: any[] = data?.data?.schedule?.events ?? [];
      const pages = data?.data?.schedule?.pages ?? {};
      return {
        events: events.map((e) => this.mapEvent(e)),
        pages,
      };
    } catch (err) {
      this.logger.warn(`getSchedule failed: ${err}`);
      return { events: [], pages: {} };
    }
  }

  private getDelayedStartingTime(offsetSeconds = 200): string {
    const t = new Date(Date.now() - offsetSeconds * 1000);
    const s = t.getUTCSeconds();
    t.setUTCSeconds(s - (s % 10), 0);
    return t.toISOString().replace(/\.\d{3}Z$/, '.000Z');
  }

  async getLiveStats(gameId: string, startingTime?: string) {
    try {
      const st = startingTime ?? this.getDelayedStartingTime();
      const url = `${LIVE_STATS_API}/window/${gameId}?startingTime=${encodeURIComponent(st)}`;
      const data = await this.fetchJson<any>(url, false);
      return data;
    } catch (err) {
      this.logger.warn(`getLiveStats failed for ${gameId}: ${err}`);
      return null;
    }
  }

  async getLiveStatsDetails(gameId: string, startingTime?: string) {
    try {
      const st = startingTime ?? this.getDelayedStartingTime();
      const url = `${LIVE_STATS_API}/details/${gameId}?startingTime=${encodeURIComponent(st)}`;
      const data = await this.fetchJson<any>(url, false);
      return data;
    } catch (err) {
      this.logger.warn(`getLiveStatsDetails failed for ${gameId}: ${err}`);
      return null;
    }
  }

  async getEventDetails(matchId: string, hl = 'vi-VN') {
    try {
      const data = await this.fetchJson<any>(
        `${LOL_ESPORTS_API}/getEventDetails?hl=${hl}&id=${matchId}`,
      );
      const event = data?.data?.event;
      if (!event) return null;
      return this.mapEventDetail(event);
    } catch (err) {
      this.logger.warn(`getEventDetails failed for ${matchId}: ${err}`);
      return null;
    }
  }

  private mapEvent(e: any) {
    const streams: any[] = e.streams ?? [];
    const youtubeStream = streams.find((s) => s.provider === 'youtube');
    const twitchStream = streams.find((s) => s.provider === 'twitch');

    const games: any[] = e.match?.games ?? [];
    const inProgressGame = games.find((g) => g.state === 'inProgress');

    return {
      id: e.id,
      startTime: e.startTime,
      state: e.state,
      blockName: e.blockName,
      league: {
        id: e.league?.id,
        name: e.league?.name,
        slug: e.league?.slug,
        image: e.league?.image,
      },
      tournament: e.tournament,
      match: {
        id: e.match?.id,
        strategy: e.match?.strategy,
        teams: (e.match?.teams ?? []).map((t: any) => ({
          id: t.id,
          name: t.name,
          code: t.code,
          image: t.image,
          result: t.result,
          record: t.record,
        })),
        games: games.map((g: any) => ({
          number: g.number,
          id: g.id,
          state: g.state,
        })),
      },
      streams: {
        youtube: youtubeStream
          ? {
              videoId: youtubeStream.parameter,
              locale: youtubeStream.locale,
              statsEnabled: youtubeStream.statsStatus === 'enabled',
            }
          : null,
        twitch: twitchStream
          ? {
              channel: twitchStream.parameter,
              locale: twitchStream.locale,
              statsEnabled: twitchStream.statsStatus === 'enabled',
            }
          : null,
      },
      liveGameId: inProgressGame?.id ?? null,
    };
  }

  private mapEventDetail(event: any) {
    const mapped = this.mapEvent(event);
    return {
      ...mapped,
      match: {
        ...mapped.match,
        games: (event.match?.games ?? []).map((g: any) => ({
          number: g.number,
          id: g.id,
          state: g.state,
          vods: g.vods ?? [],
          teams: g.teams ?? [],
        })),
      },
    };
  }
}
