import { GridService } from '../services/grid.service';
export declare class GridController {
    private readonly grid;
    constructor(grid: GridService);
    getSchedule(titleIds?: string, from?: string, to?: string, withScores?: string): Promise<any>;
    getLive(titleIds?: string): Promise<any>;
    getSeriesState(id: string): Promise<any>;
    getSeriesInfo(id: string): Promise<any>;
    getTitles(): Promise<any>;
}
