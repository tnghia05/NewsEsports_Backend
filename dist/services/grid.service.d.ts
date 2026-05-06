export declare const GRID_TITLE: {
    readonly CS2: "28";
    readonly DOTA2: "2";
};
export declare class GridService {
    private readonly logger;
    private gql;
    getSchedule(titleIds?: string[], dateFrom?: string, dateTo?: string): Promise<any>;
    getLiveSeries(titleIds?: string[]): Promise<any>;
    getSeriesState(seriesId: string): Promise<any>;
    getSeriesInfo(seriesId: string): Promise<any>;
    getScheduleWithScores(titleIds?: string[], dateFrom?: string, dateTo?: string): Promise<any>;
    getTitles(): Promise<any>;
}
