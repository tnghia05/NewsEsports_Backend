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
export declare class KalstropService {
    private readonly logger;
    private readonly cache;
    private readonly inFlight;
    private readonly minCallGapMs;
    private throttleQueue;
    private getCached;
    private setCache;
    private getHeaders;
    private lastCallAt;
    private throttle;
    private fetchApi;
    private parseDecimalOdds;
    private extractOddsFromCompetitor;
    private transformFixtures;
    private extractNodes;
    private fetchFixturesUncached;
    getFixtures(sport: string, type: 'live' | 'upcoming' | 'popular', region?: string): Promise<KalstropFixture[]>;
    getCompetitions(categorySlug: string): Promise<{
        slug: string;
        name: string;
        fixturesCount: number;
        weight: number;
    }[]>;
    getCompetitionFixtures(competitionSlug: string): Promise<KalstropFixture[]>;
    getFixtureDetails(fixtureId: string, group?: string): Promise<any>;
    private extractWinnerOddsFromDetails;
    getFixtureSsrGroups(sport: string, category: string, tournament: string, fixture: string): Promise<any>;
}
