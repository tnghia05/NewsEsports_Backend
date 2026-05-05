import { Injectable, Logger } from '@nestjs/common';

const GRID_API = 'https://api-op.grid.gg';
const GRID_KEY = process.env.GRID_API_KEY ?? 'p4EAhc88U9nO2nXz9sGhs30XCJOaIDpYS5gbo8SO';

export const GRID_TITLE = { CS2: '28', DOTA2: '2' } as const;

@Injectable()
export class GridService {
  private readonly logger = new Logger(GridService.name);

  private async gql<T>(endpoint: string, query: string, variables?: Record<string, any>): Promise<T | null> {
    try {
      const res = await fetch(`${GRID_API}${endpoint}`, {
        method: 'POST',
        headers: { 'x-api-key': GRID_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, variables }),
      });
      const json = await res.json() as any;
      if (json.errors) {
        this.logger.warn(`GRID GQL error: ${json.errors[0]?.message}`);
        return null;
      }
      return json.data as T;
    } catch (err) {
      this.logger.error(`GRID fetch failed: ${err}`);
      return null;
    }
  }

  async getSchedule(titleIds: string[] = ['28', '2'], dateFrom?: string, dateTo?: string) {
    const from = dateFrom ?? new Date(Date.now() - 3 * 24 * 3600_000).toISOString();
    const to = dateTo ?? new Date(Date.now() + 7 * 24 * 3600_000).toISOString();
    const data = await this.gql<any>('/central-data/graphql', `
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
              teams { baseInfo { id name } }
            }
          }
        }
      }
    `, { from, to, titleIds });
    return data?.allSeries?.edges?.map((e: any) => e.node) ?? [];
  }

  async getLiveSeries(titleIds: string[] = ['28', '2']) {
    const from = new Date(Date.now() - 12 * 3600_000).toISOString();
    const to = new Date(Date.now() + 1 * 3600_000).toISOString();
    const data = await this.gql<any>('/central-data/graphql', `
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
              teams { baseInfo { id name } }
            }
          }
        }
      }
    `, { from, to, titleIds });
    return data?.allSeries?.edges?.map((e: any) => e.node) ?? [];
  }

  async getSeriesState(seriesId: string) {
    const data = await this.gql<any>('/live-data-feed/series-state/graphql', `
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

  async getSeriesInfo(seriesId: string) {
    const data = await this.gql<any>('/central-data/graphql', `
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

  async getTitles() {
    const data = await this.gql<any>('/central-data/graphql', `{ titles { id name } }`);
    return data?.titles ?? [];
  }
}
