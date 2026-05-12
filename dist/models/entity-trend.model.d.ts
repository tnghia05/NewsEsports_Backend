import type { HydratedDocument } from 'mongoose';
export type EntityTrendDocument = HydratedDocument<EntityTrend>;
export declare const EntityTrendModelName = "EntityTrend";
export type EntityType = 'PLAYER' | 'TEAM' | 'TOURNAMENT';
export type EntityTrendWindow = '3h' | '24h' | '7d';
export declare class EntityTrend {
    entity: string;
    entityType: EntityType;
    window: EntityTrendWindow;
    mentionCount: number;
    sentiment: {
        positive: number;
        negative: number;
        neutral: number;
        toxic: number;
    };
    toxicRate: number;
    intent: {
        praise: number;
        complain: number;
        question: number;
        other: number;
    };
    updatedAt: Date;
}
export declare const EntityTrendSchema: import("mongoose").Schema<EntityTrend, import("mongoose").Model<EntityTrend, any, any, any, any, any, EntityTrend>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, EntityTrend, import("mongoose").Document<unknown, {}, EntityTrend, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<EntityTrend & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    entity?: import("mongoose").SchemaDefinitionProperty<string, EntityTrend, import("mongoose").Document<unknown, {}, EntityTrend, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<EntityTrend & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    entityType?: import("mongoose").SchemaDefinitionProperty<EntityType, EntityTrend, import("mongoose").Document<unknown, {}, EntityTrend, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<EntityTrend & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    window?: import("mongoose").SchemaDefinitionProperty<EntityTrendWindow, EntityTrend, import("mongoose").Document<unknown, {}, EntityTrend, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<EntityTrend & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    mentionCount?: import("mongoose").SchemaDefinitionProperty<number, EntityTrend, import("mongoose").Document<unknown, {}, EntityTrend, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<EntityTrend & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    sentiment?: import("mongoose").SchemaDefinitionProperty<{
        positive: number;
        negative: number;
        neutral: number;
        toxic: number;
    }, EntityTrend, import("mongoose").Document<unknown, {}, EntityTrend, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<EntityTrend & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    toxicRate?: import("mongoose").SchemaDefinitionProperty<number, EntityTrend, import("mongoose").Document<unknown, {}, EntityTrend, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<EntityTrend & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    intent?: import("mongoose").SchemaDefinitionProperty<{
        praise: number;
        complain: number;
        question: number;
        other: number;
    }, EntityTrend, import("mongoose").Document<unknown, {}, EntityTrend, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<EntityTrend & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    updatedAt?: import("mongoose").SchemaDefinitionProperty<Date, EntityTrend, import("mongoose").Document<unknown, {}, EntityTrend, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<EntityTrend & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
}, EntityTrend>;
