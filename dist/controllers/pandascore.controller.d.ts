import { PandaScoreService } from '../infra/pandascore/pandascore.service';
export declare class PandaScoreController {
    private readonly pandaScore;
    constructor(pandaScore: PandaScoreService);
    getLeagues(videogame?: string): Promise<import("../infra/pandascore/pandascore.service").PandaScoreLeague[]>;
    getRunningSeries(videogame?: string): Promise<import("../infra/pandascore/pandascore.service").PandaScoreSerie[]>;
    getUpcomingSeries(videogame?: string): Promise<import("../infra/pandascore/pandascore.service").PandaScoreSerie[]>;
    getPastSeries(videogame?: string): Promise<import("../infra/pandascore/pandascore.service").PandaScoreSerie[]>;
    getSerieMatches(slug: string, status?: 'running' | 'upcoming' | 'past'): Promise<import("../infra/pandascore/pandascore.service").PandaScoreMatch[]>;
    getSerieDetail(slug: string): Promise<{}>;
    getRunningTournaments(videogame?: string): Promise<import("../infra/pandascore/pandascore.service").PandaScoreTournament[]>;
    getTournamentStandings(id: string): Promise<import("../infra/pandascore/pandascore.service").PandaScoreStanding[]>;
    getTournamentTeams(id: string): Promise<import("../infra/pandascore/pandascore.service").PandaScoreTeam[]>;
    getTournamentRosters(id: string): Promise<import("../infra/pandascore/pandascore.service").PandaScoreRoster[]>;
    getMatchDetail(matchIdOrSlug: string): Promise<{}>;
    getMatchOpponents(matchIdOrSlug: string): Promise<{}>;
    getLoLGame(gameId: string): Promise<{}>;
    getGameDetail(gameSlug: string, gameId: string): Promise<{}>;
}
