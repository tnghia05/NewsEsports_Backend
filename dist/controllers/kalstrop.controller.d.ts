import { KalstropService } from '../services/kalstrop.service';
export declare class KalstropController {
    private readonly kalstrop;
    constructor(kalstrop: KalstropService);
    getFixtures(sport: string, type: string, region?: string): Promise<import("../services/kalstrop.service").KalstropFixture[]>;
    getFixtureDetails(id: string, group?: string): Promise<any>;
    getFixtureSsr(sport: string, category: string, tournament: string, fixture: string): Promise<any>;
}
