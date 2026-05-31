import { Types, type Model } from 'mongoose';
import { type PredictionDocument } from '../models/prediction.model';
import { type MatchDocument } from '../models/match.model';
import { type UserDocument } from '../models/user.model';
import { PointsService } from './points.service';
export declare class PredictionsService {
    private readonly predictionModel;
    private readonly matchModel;
    private readonly userModel;
    private readonly pointsService;
    constructor(predictionModel: Model<PredictionDocument>, matchModel: Model<MatchDocument>, userModel: Model<UserDocument>, pointsService: PointsService);
    place(userId: string, matchId: string, teamIndex: number, pointsBet: number, oddsSnapshot: number): Promise<import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, import("../models/prediction.model").Prediction, {}, import("mongoose").DefaultSchemaOptions> & import("../models/prediction.model").Prediction & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    }, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").Document<unknown, {}, import("../models/prediction.model").Prediction, {}, import("mongoose").DefaultSchemaOptions> & import("../models/prediction.model").Prediction & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    } & Required<{
        _id: Types.ObjectId;
    }>>;
    settle(matchId: string, winnerTeamIndex: number): Promise<{
        settled: number;
        results: {
            userId: string;
            status: "won" | "lost";
            pointsWon?: number;
        }[];
    }>;
    cancelMatch(matchId: string): Promise<{
        refunded: number;
    }>;
    listByUser(userId: string, limit?: number, skip?: number): Promise<{
        items: (import("mongoose").Document<unknown, {}, import("../models/prediction.model").Prediction, {}, import("mongoose").DefaultSchemaOptions> & import("../models/prediction.model").Prediction & {
            _id: Types.ObjectId;
        } & {
            __v: number;
        } & {
            id: string;
        } & Required<{
            _id: Types.ObjectId;
        }>)[];
        total: number;
    }>;
    listByMatch(matchId: string): Promise<(import("mongoose").Document<unknown, {}, import("../models/prediction.model").Prediction, {}, import("mongoose").DefaultSchemaOptions> & import("../models/prediction.model").Prediction & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    } & Required<{
        _id: Types.ObjectId;
    }>)[]>;
    listByMatchForAdmin(matchId: string): Promise<{
        displayName: any;
        _id: Types.ObjectId;
        $locals: Record<string, unknown>;
        $op: "save" | "validate" | "remove" | null;
        $where: Record<string, unknown>;
        baseModelName?: string;
        collection: import("mongoose").Collection;
        db: import("mongoose").Connection;
        errors?: import("mongoose").Error.ValidationError;
        isNew: boolean;
        schema: import("mongoose").Schema;
        userId: string;
        matchId: string;
        teamIndex: number;
        teamName: string;
        pointsBet: number;
        oddsAtBet: number;
        status: import("../models/prediction.model").PredictionStatus;
        pointsWon?: number;
        settledAt?: Date;
        __v: number;
        id: string;
    }[]>;
    getMyPredictionForMatch(userId: string, matchId: string): Promise<(import("mongoose").Document<unknown, {}, import("../models/prediction.model").Prediction, {}, import("mongoose").DefaultSchemaOptions> & import("../models/prediction.model").Prediction & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    } & Required<{
        _id: Types.ObjectId;
    }>) | null>;
    getPendingMatchSummary(): Promise<{
        matchId: string;
        matchName: any;
        teams: any;
        matchStatus: any;
        count: number;
        totalPoints: number;
    }[]>;
}
