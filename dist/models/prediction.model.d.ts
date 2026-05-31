import type { HydratedDocument } from 'mongoose';
export type PredictionDocument = HydratedDocument<Prediction>;
export declare const PredictionModelName = "Prediction";
export type PredictionStatus = 'pending' | 'won' | 'lost' | 'cancelled';
export declare class Prediction {
    userId: string;
    matchId: string;
    teamIndex: number;
    teamName: string;
    pointsBet: number;
    oddsAtBet: number;
    status: PredictionStatus;
    pointsWon?: number;
    settledAt?: Date;
}
export declare const PredictionSchema: import("mongoose").Schema<Prediction, import("mongoose").Model<Prediction, any, any, any, any, any, Prediction>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Prediction, import("mongoose").Document<unknown, {}, Prediction, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<Prediction & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    userId?: import("mongoose").SchemaDefinitionProperty<string, Prediction, import("mongoose").Document<unknown, {}, Prediction, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Prediction & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    matchId?: import("mongoose").SchemaDefinitionProperty<string, Prediction, import("mongoose").Document<unknown, {}, Prediction, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Prediction & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    teamIndex?: import("mongoose").SchemaDefinitionProperty<number, Prediction, import("mongoose").Document<unknown, {}, Prediction, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Prediction & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    teamName?: import("mongoose").SchemaDefinitionProperty<string, Prediction, import("mongoose").Document<unknown, {}, Prediction, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Prediction & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    pointsBet?: import("mongoose").SchemaDefinitionProperty<number, Prediction, import("mongoose").Document<unknown, {}, Prediction, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Prediction & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    oddsAtBet?: import("mongoose").SchemaDefinitionProperty<number, Prediction, import("mongoose").Document<unknown, {}, Prediction, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Prediction & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    status?: import("mongoose").SchemaDefinitionProperty<PredictionStatus, Prediction, import("mongoose").Document<unknown, {}, Prediction, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Prediction & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    pointsWon?: import("mongoose").SchemaDefinitionProperty<number | undefined, Prediction, import("mongoose").Document<unknown, {}, Prediction, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Prediction & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    settledAt?: import("mongoose").SchemaDefinitionProperty<Date | undefined, Prediction, import("mongoose").Document<unknown, {}, Prediction, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Prediction & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
}, Prediction>;
