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

  private getDelayedStartingTime(offsetSeconds = 175): string {
    const t = new Date(Date.now() - offsetSeconds * 1000);
    const s = t.getUTCSeconds();
    t.setUTCSeconds(s - (s % 10), 0);
    return t.toISOString().replace(/\.\d{3}Z$/, '.000Z');
  }

  private async fetchWithRetry(baseUrl: string, gameId: string, offsets: number[]): Promise<any> {
    for (const offset of offsets) {
      const st = this.getDelayedStartingTime(offset);
      const url = `${baseUrl}/${gameId}?startingTime=${encodeURIComponent(st)}`;
      const res = await fetch(url);
      if (res.ok) {
        const text = await res.text();
        if (!text || text.trim() === '') return null;
        return JSON.parse(text);
      }
      const body = await res.text().catch(() => '');
      if (!body.includes('ahead of broadcast')) {
        this.logger.warn(`fetchWithRetry ${offset}s: ${res.status} ${body.slice(0, 100)}`);
        return null;
      }
    }
    return null;
  }

  async getLiveStats(gameId: string, startingTime?: string) {
    try {
      if (startingTime) {
        return await this.fetchJson<any>(
          `${LIVE_STATS_API}/window/${gameId}?startingTime=${encodeURIComponent(startingTime)}`,
          false,
        );
      }
      return await this.fetchWithRetry(`${LIVE_STATS_API}/window`, gameId, [175, 185, 200, 220]);
    } catch (err) {
      this.logger.warn(`getLiveStats failed for ${gameId}: ${err}`);
      return null;
    }
  }

  async getLiveStatsDetails(gameId: string, startingTime?: string) {
    try {
      if (startingTime) {
        return await this.fetchJson<any>(
          `${LIVE_STATS_API}/details/${gameId}?startingTime=${encodeURIComponent(startingTime)}`,
          false,
        );
      }
      return await this.fetchWithRetry(`${LIVE_STATS_API}/details`, gameId, [175, 185, 200, 220]);
    } catch (err) {
      this.logger.warn(`getLiveStatsDetails failed for ${gameId}: ${err}`);
      return null;
    }
  }

  private roundToTenSeconds(date: Date): string {
    const s = date.getUTCSeconds();
    date.setUTCSeconds(s - (s % 10), 0);
    return date.toISOString().replace(/\.\d{3}Z$/, '.000Z');
  }

  private async findFinishedFrame(gameId: string, firstFrameTime: string): Promise<any | null> {
    const base = new Date(firstFrameTime).getTime();
    for (let minOffset = 15; minOffset <= 60; minOffset += 5) {
      const t = new Date(base + minOffset * 60 * 1000);
      const st = this.roundToTenSeconds(t);
      try {
        const res = await fetch(`${LIVE_STATS_API}/window/${gameId}?startingTime=${encodeURIComponent(st)}`);
        if (!res.ok) continue;
        const data = await res.json();
        const frames: any[] = data?.frames ?? [];
        const finishedFrame = frames.find((f: any) => f.gameState === 'finished');
        if (finishedFrame) return { frame: finishedFrame, metadata: data.gameMetadata };
        const lastFrame = frames[frames.length - 1];
        if (lastFrame?.blueTeam?.totalGold > 0) {
          const lastIdx = frames.length - 1;
          for (let i = lastIdx; i >= 0; i--) {
            if (frames[i].gameState === 'finished') return { frame: frames[i], metadata: data.gameMetadata };
          }
        }
      } catch { continue; }
    }
    return null;
  }

  async getPostgameStats(gameId: string, firstFrameTime?: string) {
    try {
      let result: { frame: any; metadata: any } | null = null;

      if (firstFrameTime) {
        result = await this.findFinishedFrame(gameId, firstFrameTime);
      }

      if (!result) {
        const st = this.getDelayedStartingTime(175);
        const res = await fetch(`${LIVE_STATS_API}/window/${gameId}?startingTime=${encodeURIComponent(st)}`);
        if (res.ok) {
          const data = await res.json();
          const frames: any[] = data?.frames ?? [];
          const finished = frames.find((f: any) => f.gameState === 'finished') ?? frames[frames.length - 1];
          if (finished?.blueTeam?.totalGold > 0) result = { frame: finished, metadata: data.gameMetadata };
        }
      }

      if (!result) return null;

      const { frame, metadata } = result;
      const blueParticipantsMeta: any[] = metadata?.blueTeamMetadata?.participantMetadata ?? [];
      const redParticipantsMeta: any[] = metadata?.redTeamMetadata?.participantMetadata ?? [];

      const mapParticipants = (participants: any[], metaList: any[]) =>
        participants.map((p: any) => {
          const meta = metaList.find((m: any) => m.participantId === p.participantId) ?? {};
          return {
            participantId: p.participantId,
            summonerName: meta.summonerName ?? '',
            championId: meta.championId ?? '',
            role: meta.role ?? '',
            kills: p.kills,
            deaths: p.deaths,
            assists: p.assists,
            totalGold: p.totalGold,
            creepScore: p.creepScore,
            level: p.level,
          };
        });

      return {
        gameState: frame.gameState,
        blueTeam: {
          totalGold: frame.blueTeam.totalGold,
          totalKills: frame.blueTeam.totalKills,
          towers: frame.blueTeam.towers,
          inhibitors: frame.blueTeam.inhibitors,
          barons: frame.blueTeam.barons,
          dragons: frame.blueTeam.dragons,
          participants: mapParticipants(frame.blueTeam.participants ?? [], blueParticipantsMeta),
        },
        redTeam: {
          totalGold: frame.redTeam.totalGold,
          totalKills: frame.redTeam.totalKills,
          towers: frame.redTeam.towers,
          inhibitors: frame.redTeam.inhibitors,
          barons: frame.redTeam.barons,
          dragons: frame.redTeam.dragons,
          participants: mapParticipants(frame.redTeam.participants ?? [], redParticipantsMeta),
        },
      };
    } catch (err) {
      this.logger.warn(`getPostgameStats failed for ${gameId}: ${err}`);
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
