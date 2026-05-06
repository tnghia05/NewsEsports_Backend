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
    videogame?: {
        id: number;
        name: string;
        slug: string;
    };
    tournament?: {
        id: number;
        name: string;
        slug: string;
    };
    league?: {
        id: number;
        name: string;
        slug: string;
    };
    serie?: {
        id: number;
        name: string;
        slug: string;
    };
    opponents?: Array<{
        opponent: PandaScoreTeam;
        type: string;
    }>;
    results?: Array<{
        team_id: number;
        score: number;
    }>;
    number_of_games?: number;
}
export declare class PandaScoreService {
    private readonly config;
    private readonly logger;
    private readonly baseUrl;
    private readonly timeoutMs;
    private readonly token;
    constructor(config: ConfigService);
    get isConfigured(): boolean;
    fetchRunningMatches(perPage?: number): Promise<PandaScoreMatch[]>;
    fetchUpcomingMatches(perPage?: number): Promise<PandaScoreMatch[]>;
    fetchPastMatches(perPage?: number): Promise<PandaScoreMatch[]>;
    fetchMatchDetail(matchIdOrSlug: string): Promise<unknown | null>;
    fetchMatchOpponents(matchIdOrSlug: string): Promise<unknown | null>;
    fetchLoLGame(gameId: string): Promise<unknown | null>;
    fetchGameDetail(gameSlug: string, gameId: string): Promise<unknown | null>;
    private fetchPage;
    private fetchJson;
}
