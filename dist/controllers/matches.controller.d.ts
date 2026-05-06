import { MatchesService } from '../services/matches.service';
import { MatchSyncWorkerService } from '../services/match-sync-worker.service';
import { QueryMatchesDto } from '../dto/matches/query-matches.dto';
export declare class MatchesController {
    private readonly matchesService;
    private readonly matchSyncWorkerService;
    constructor(matchesService: MatchesService, matchSyncWorkerService: MatchSyncWorkerService);
    list(query: QueryMatchesDto): Promise<{
        items: (import("mongoose").Document<unknown, {}, import("../models/match.model").Match, {}, import("mongoose").DefaultSchemaOptions> & import("../models/match.model").Match & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        } & {
            id: string;
        } & Required<{
            _id: import("mongoose").Types.ObjectId;
        }>)[];
        page: number;
        limit: number;
        total: number;
        hasMore: boolean;
    }>;
    stats(): Promise<{
        live: number;
        upcoming: number;
        finished: number;
        total: number;
    }>;
    getById(id: string): Promise<import("mongoose").Document<unknown, {}, import("../models/match.model").Match, {}, import("mongoose").DefaultSchemaOptions> & import("../models/match.model").Match & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    } & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>>;
    syncNow(): Promise<{
        ok: boolean;
        error: string;
        upserted?: undefined;
        provider?: undefined;
    } | {
        ok: boolean;
        upserted: number;
        provider: string;
        error?: undefined;
    }>;
}
