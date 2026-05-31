import type { Model } from 'mongoose';
import { type UserDocument } from '../models/user.model';
import { type PointLedgerDocument, type PointReason } from '../models/point-ledger.model';
export declare const POINT_REWARDS: Record<PointReason, number>;
export declare class PointsService {
    private readonly userModel;
    private readonly ledgerModel;
    constructor(userModel: Model<UserDocument>, ledgerModel: Model<PointLedgerDocument>);
    getBalance(userId: string): Promise<number>;
    getHistory(userId: string, limit?: number, skip?: number): Promise<{
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
    }>;
    addPoints(userId: string, delta: number, reason: PointReason, meta?: Record<string, unknown>): Promise<number>;
    deductPoints(userId: string, amount: number, reason: PointReason, meta?: Record<string, unknown>): Promise<number>;
    checkin(userId: string): Promise<{
        points: number;
        alreadyDone: boolean;
    }>;
}
