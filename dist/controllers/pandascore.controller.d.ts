import { PandaScoreService } from '../infra/pandascore/pandascore.service';
export declare class PandaScoreController {
    private readonly pandaScore;
    constructor(pandaScore: PandaScoreService);
    getMatchDetail(matchIdOrSlug: string): Promise<{}>;
    getMatchOpponents(matchIdOrSlug: string): Promise<{}>;
    getLoLGame(gameId: string): Promise<{}>;
    getGameDetail(gameSlug: string, gameId: string): Promise<{}>;
}
