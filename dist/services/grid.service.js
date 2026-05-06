"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var GridService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GridService = exports.GRID_TITLE = void 0;
const common_1 = require("@nestjs/common");
const GRID_API = 'https://api-op.grid.gg';
const GRID_KEY = process.env.GRID_API_KEY ?? 'p4EAhc88U9nO2nXz9sGhs30XCJOaIDpYS5gbo8SO';
exports.GRID_TITLE = { CS2: '28', DOTA2: '2' };
let GridService = GridService_1 = class GridService {
    logger = new common_1.Logger(GridService_1.name);
    async gql(endpoint, query, variables) {
        try {
            const res = await fetch(`${GRID_API}${endpoint}`, {
                method: 'POST',
                headers: { 'x-api-key': GRID_KEY, 'Content-Type': 'application/json' },
                body: JSON.stringify({ query, variables }),
            });
            const json = await res.json();
            if (json.errors) {
                this.logger.warn(`GRID GQL error: ${json.errors[0]?.message}`);
                return null;
            }
            return json.data;
        }
        catch (err) {
            this.logger.error(`GRID fetch failed: ${err}`);
            return null;
        }
    }
    async getSchedule(titleIds = ['28', '2'], dateFrom, dateTo) {
        const from = dateFrom ?? new Date(Date.now() - 3 * 24 * 3600_000).toISOString();
        const to = dateTo ?? new Date(Date.now() + 7 * 24 * 3600_000).toISOString();
        const data = await this.gql('/central-data/graphql', `
      query GetSchedule($from: String!, $to: String!, $titleIds: [ID!]!) {
        allSeries(
          filter: { titleIds: { in: $titleIds }, startTimeScheduled: { gte: $from, lte: $to } }
          first: 50
        ) {
          edges {
            node {
              id
              startTimeScheduled
              format { nameShortened }
              tournament { id nameShortened }
              title { id name }
              teams { baseInfo { id name } scoreAdvantage }
            }
          }
        }
      }
    `, { from, to, titleIds });
        return data?.allSeries?.edges?.map((e) => e.node) ?? [];
    }
    async getLiveSeries(titleIds = ['28', '2']) {
        const from = new Date(Date.now() - 12 * 3600_000).toISOString();
        const to = new Date(Date.now() + 1 * 3600_000).toISOString();
        const data = await this.gql('/central-data/graphql', `
      query GetLive($from: String!, $to: String!, $titleIds: [ID!]!) {
        allSeries(
          filter: { titleIds: { in: $titleIds }, startTimeScheduled: { gte: $from, lte: $to } }
          first: 20
        ) {
          edges {
            node {
              id
              startTimeScheduled
              format { nameShortened }
              tournament { id nameShortened }
              title { id name }
              teams { baseInfo { id name } scoreAdvantage }
            }
          }
        }
      }
    `, { from, to, titleIds });
        return data?.allSeries?.edges?.map((e) => e.node) ?? [];
    }
    async getSeriesState(seriesId) {
        const data = await this.gql('/live-data-feed/series-state/graphql', `
      query GetSeries($id: ID!) {
        seriesState(id: $id) {
          id
          started
          finished
          forfeited
          format
          duration
          startedAt
          updatedAt
          teams {
            id
            name
            won
            score
            players {
              id
              name
              kills
              deaths
              killAssistsGiven
              firstKill
              multikills { count numberOfKills }
            }
          }
          games {
            sequenceNumber
            started
            finished
            duration
            teams {
              id
              name
              score
              won
              side
              money
              netWorth
              players {
                id
                name
                kills
                deaths
                killAssistsGiven
                money
                netWorth
                loadoutValue
                firstKill
                multikills { count numberOfKills }
              }
            }
          }
        }
      }
    `, { id: seriesId });
        return data?.seriesState ?? null;
    }
    async getSeriesInfo(seriesId) {
        const data = await this.gql('/central-data/graphql', `
      query GetSeriesInfo($id: ID!) {
        series(id: $id) {
          id
          startTimeScheduled
          format { nameShortened }
          tournament { id nameShortened }
          title { id name }
          teams { baseInfo { id name } }
        }
      }
    `, { id: seriesId });
        return data?.series ?? null;
    }
    async getScheduleWithScores(titleIds = ['28', '2'], dateFrom, dateTo) {
        const series = await this.getSchedule(titleIds, dateFrom, dateTo);
        if (!series.length)
            return series;
        const now = Date.now();
        const past = series.filter((s) => new Date(s.startTimeScheduled).getTime() < now - 3600_000);
        const stateResults = await Promise.allSettled(past.slice(0, 20).map((s) => this.getSeriesState(s.id)));
        const stateMap = new Map();
        past.slice(0, 20).forEach((s, i) => {
            const r = stateResults[i];
            if (r.status === 'fulfilled' && r.value)
                stateMap.set(s.id, r.value);
        });
        return series.map((s) => {
            const st = stateMap.get(s.id);
            if (!st)
                return s;
            return {
                ...s,
                seriesScore: { a: st.teams?.[0]?.score ?? 0, b: st.teams?.[1]?.score ?? 0 },
                finished: st.finished,
                started: st.started,
            };
        });
    }
    async getTitles() {
        const data = await this.gql('/central-data/graphql', `{ titles { id name } }`);
        return data?.titles ?? [];
    }
};
exports.GridService = GridService;
exports.GridService = GridService = GridService_1 = __decorate([
    (0, common_1.Injectable)()
], GridService);
//# sourceMappingURL=grid.service.js.map