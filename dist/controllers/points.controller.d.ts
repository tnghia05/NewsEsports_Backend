import type { Model } from 'mongoose';
import type { JwtUser } from '../types/auth';
import { PointsService } from '../services/points.service';
import { PredictionsService } from '../services/predictions.service';
import { PlacePredictionDto } from '../dto/points/place-prediction.dto';
import { SettlePredictionDto } from '../dto/points/settle-prediction.dto';
import { RedeemProductDto } from '../dto/points/redeem-product.dto';
import { type ProductDocument } from '../models/product.model';
export declare class PointsController {
    private readonly pointsService;
    private readonly predictionsService;
    private readonly productModel;
    constructor(pointsService: PointsService, predictionsService: PredictionsService, productModel: Model<ProductDocument>);
    getMe(user: JwtUser, limit?: string, skip?: string): Promise<{
        items: (import("mongoose").Document<unknown, {}, import("../models/point-ledger.model").PointLedger, {}, import("mongoose").DefaultSchemaOptions> & import("../models/point-ledger.model").PointLedger & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        } & {
            id: string;
        } & Required<{
            _id: import("mongoose").Types.ObjectId;
        }>)[];
        total: number;
        balance: number;
    }>;
    checkin(user: JwtUser): Promise<{
        points: number;
        alreadyDone: boolean;
    }>;
    listPredictions(user: JwtUser, limit?: string, skip?: string): Promise<{
        items: (import("mongoose").Document<unknown, {}, import("../models/prediction.model").Prediction, {}, import("mongoose").DefaultSchemaOptions> & import("../models/prediction.model").Prediction & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        } & {
            id: string;
        } & Required<{
            _id: import("mongoose").Types.ObjectId;
        }>)[];
        total: number;
    }>;
    getMyPrediction(user: JwtUser, matchId: string): Promise<(import("mongoose").Document<unknown, {}, import("../models/prediction.model").Prediction, {}, import("mongoose").DefaultSchemaOptions> & import("../models/prediction.model").Prediction & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    } & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>) | null>;
    placePrediction(user: JwtUser, dto: PlacePredictionDto): Promise<import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, import("../models/prediction.model").Prediction, {}, import("mongoose").DefaultSchemaOptions> & import("../models/prediction.model").Prediction & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    }, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").Document<unknown, {}, import("../models/prediction.model").Prediction, {}, import("mongoose").DefaultSchemaOptions> & import("../models/prediction.model").Prediction & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    } & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>>;
    settle(matchId: string, dto: SettlePredictionDto): Promise<{
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
    getPendingSummary(): Promise<{
        matchId: string;
        matchName: any;
        teams: any;
        matchStatus: any;
        count: number;
        totalPoints: number;
    }[]>;
    listByMatchAdmin(matchId: string): Promise<{
        displayName: any;
        _id: import("mongoose").Types.ObjectId;
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
    getStore(limit?: string, skip?: string): Promise<{
        items: (import("mongoose").Document<unknown, {}, import("../models/product.model").Product, {}, import("mongoose").DefaultSchemaOptions> & import("../models/product.model").Product & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        } & {
            id: string;
        } & Required<{
            _id: import("mongoose").Types.ObjectId;
        }>)[];
        total: number;
    }>;
    redeem(user: JwtUser, dto: RedeemProductDto): Promise<{
        success: boolean;
        productName: string;
        pointsSpent: number;
    }>;
}
