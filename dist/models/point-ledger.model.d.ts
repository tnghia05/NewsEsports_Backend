import type { HydratedDocument } from 'mongoose';
export type PointLedgerDocument = HydratedDocument<PointLedger>;
export declare const PointLedgerModelName = "PointLedger";
export type PointReason = 'checkin' | 'post_publish' | 'comment_create' | 'prediction_win' | 'prediction_bet' | 'redeem_product' | 'checkout_discount' | 'admin_adjust';
export declare class PointLedger {
    userId: string;
    delta: number;
    balanceAfter: number;
    reason: PointReason;
    meta?: Record<string, unknown>;
}
export declare const PointLedgerSchema: import("mongoose").Schema<PointLedger, import("mongoose").Model<PointLedger, any, any, any, any, any, PointLedger>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, PointLedger, import("mongoose").Document<unknown, {}, PointLedger, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<PointLedger & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    userId?: import("mongoose").SchemaDefinitionProperty<string, PointLedger, import("mongoose").Document<unknown, {}, PointLedger, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<PointLedger & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    delta?: import("mongoose").SchemaDefinitionProperty<number, PointLedger, import("mongoose").Document<unknown, {}, PointLedger, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<PointLedger & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    balanceAfter?: import("mongoose").SchemaDefinitionProperty<number, PointLedger, import("mongoose").Document<unknown, {}, PointLedger, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<PointLedger & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    reason?: import("mongoose").SchemaDefinitionProperty<PointReason, PointLedger, import("mongoose").Document<unknown, {}, PointLedger, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<PointLedger & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    meta?: import("mongoose").SchemaDefinitionProperty<Record<string, unknown> | undefined, PointLedger, import("mongoose").Document<unknown, {}, PointLedger, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<PointLedger & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
}, PointLedger>;
