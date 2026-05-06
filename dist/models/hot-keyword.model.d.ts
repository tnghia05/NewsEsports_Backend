import type { HydratedDocument } from 'mongoose';
export type { Sentiment4Label, IntentLabel, AspectLabel, } from '../types/ai-labels';
import type { Sentiment4Label, IntentLabel, AspectLabel } from '../types/ai-labels';
export type HotKeywordDocument = HydratedDocument<HotKeyword>;
export declare const HotKeywordModelName = "HotKeyword";
export type HotKeywordWindow = '24h' | '7d';
export type HotKeywordTrend = {
    sampleCount: number;
    labeledCount: number;
    toxicCount: number;
    sentiment4: Partial<Record<Sentiment4Label, number>>;
    intent: Partial<Record<IntentLabel, number>>;
    aspect: Partial<Record<AspectLabel, number>>;
    sentiment4Avg?: Partial<Record<Sentiment4Label, number>>;
    intentAvg?: Partial<Record<IntentLabel, number>>;
    aspectAvg?: Partial<Record<AspectLabel, number>>;
};
export declare class HotKeyword {
    keyword: string;
    window: HotKeywordWindow;
    score: number;
    trend?: HotKeywordTrend;
    trendUpdatedAt?: Date;
    updatedAt: Date;
}
export declare const HotKeywordSchema: import("mongoose").Schema<HotKeyword, import("mongoose").Model<HotKeyword, any, any, any, any, any, HotKeyword>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, HotKeyword, import("mongoose").Document<unknown, {}, HotKeyword, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<HotKeyword & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    keyword?: import("mongoose").SchemaDefinitionProperty<string, HotKeyword, import("mongoose").Document<unknown, {}, HotKeyword, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<HotKeyword & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    window?: import("mongoose").SchemaDefinitionProperty<HotKeywordWindow, HotKeyword, import("mongoose").Document<unknown, {}, HotKeyword, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<HotKeyword & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    score?: import("mongoose").SchemaDefinitionProperty<number, HotKeyword, import("mongoose").Document<unknown, {}, HotKeyword, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<HotKeyword & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    trend?: import("mongoose").SchemaDefinitionProperty<HotKeywordTrend | undefined, HotKeyword, import("mongoose").Document<unknown, {}, HotKeyword, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<HotKeyword & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    trendUpdatedAt?: import("mongoose").SchemaDefinitionProperty<Date | undefined, HotKeyword, import("mongoose").Document<unknown, {}, HotKeyword, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<HotKeyword & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    updatedAt?: import("mongoose").SchemaDefinitionProperty<Date, HotKeyword, import("mongoose").Document<unknown, {}, HotKeyword, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<HotKeyword & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
}, HotKeyword>;
