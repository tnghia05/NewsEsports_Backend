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
    videogame?: {
        id: number;
        name: string;
        slug: string;
    };
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
    league?: {
        id: number;
        name: string;
        slug: string;
        image_url?: string;
    };
    league_id?: number;
    videogame?: {
        id: number;
        name: string;
        slug: string;
    };
    tournaments?: PandaScoreTournament[];
}
export interface PandaScoreTournament {
    id: number;
    name: string;
    slug: string;
    begin_at?: string;
    end_at?: string;
    league?: {
        id: number;
        name: string;
        slug: string;
    };
    league_id?: number;
    serie_id?: number;
    videogame?: {
        id: number;
        name: string;
        slug: string;
    };
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
    fetchLeagues(videogame?: string): Promise<PandaScoreLeague[]>;
    fetchRunningSeries(videogame?: string): Promise<PandaScoreSerie[]>;
    fetchUpcomingSeries(videogame?: string): Promise<PandaScoreSerie[]>;
    fetchPastSeries(videogame?: string): Promise<PandaScoreSerie[]>;
    fetchSerieDetail(slug: string): Promise<unknown | null>;
    fetchSerieMatches(slug: string, status?: 'running' | 'upcoming' | 'past'): Promise<PandaScoreMatch[]>;
    fetchRunningTournaments(videogame?: string): Promise<PandaScoreTournament[]>;
    fetchTournamentStandings(tournamentId: string): Promise<PandaScoreStanding[]>;
    fetchTournamentTeams(tournamentId: string): Promise<PandaScoreTeam[]>;
    fetchGameDetail(gameSlug: string, gameId: string): Promise<unknown | null>;
    private fetchList;
    private fetchPage;
    private fetchJson;
}
