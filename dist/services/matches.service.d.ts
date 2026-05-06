import type { Model } from 'mongoose';
import { type MatchDocument } from '../models/match.model';
import type { QueryMatchesDto } from '../dto/matches/query-matches.dto';
export declare class MatchesService {
    private readonly matchModel;
    constructor(matchModel: Model<MatchDocument>);
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
    getById(id: string): Promise<import("mongoose").Document<unknown, {}, import("../models/match.model").Match, {}, import("mongoose").DefaultSchemaOptions> & import("../models/match.model").Match & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    } & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>>;
    getStats(): Promise<{
        live: number;
        upcoming: number;
        finished: number;
        total: number;
    }>;
}
