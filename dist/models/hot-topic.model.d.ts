import type { HydratedDocument } from 'mongoose';
import type { AspectLabel, IntentLabel, Sentiment4Label } from './hot-keyword.model';
export type HotTopicDocument = HydratedDocument<HotTopic>;
export declare const HotTopicModelName = "HotTopic";
export type HotTopicWindow = '3h' | '24h' | '7d';
export type HotTopicComponents = {
    read: number;
    discuss: number;
    originalUsers: number;
    likes: number;
    searchVolume: number;
    velocityScore: number;
};
export type HotTopicTrend = {
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
export declare class HotTopic {
    tag: string;
    window: HotTopicWindow;
    hotness: number;
    components: HotTopicComponents;
    trend?: HotTopicTrend;
    trendUpdatedAt?: Date;
    updatedAt: Date;
}
export declare const HotTopicSchema: import("mongoose").Schema<HotTopic, import("mongoose").Model<HotTopic, any, any, any, any, any, HotTopic>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, HotTopic, import("mongoose").Document<unknown, {}, HotTopic, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<HotTopic & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    tag?: import("mongoose").SchemaDefinitionProperty<string, HotTopic, import("mongoose").Document<unknown, {}, HotTopic, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<HotTopic & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    window?: import("mongoose").SchemaDefinitionProperty<HotTopicWindow, HotTopic, import("mongoose").Document<unknown, {}, HotTopic, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<HotTopic & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    hotness?: import("mongoose").SchemaDefinitionProperty<number, HotTopic, import("mongoose").Document<unknown, {}, HotTopic, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<HotTopic & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    components?: import("mongoose").SchemaDefinitionProperty<HotTopicComponents, HotTopic, import("mongoose").Document<unknown, {}, HotTopic, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<HotTopic & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    trend?: import("mongoose").SchemaDefinitionProperty<HotTopicTrend | undefined, HotTopic, import("mongoose").Document<unknown, {}, HotTopic, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<HotTopic & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    trendUpdatedAt?: import("mongoose").SchemaDefinitionProperty<Date | undefined, HotTopic, import("mongoose").Document<unknown, {}, HotTopic, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<HotTopic & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    updatedAt?: import("mongoose").SchemaDefinitionProperty<Date, HotTopic, import("mongoose").Document<unknown, {}, HotTopic, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<HotTopic & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
}, HotTopic>;
