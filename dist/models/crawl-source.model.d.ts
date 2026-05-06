import type { HydratedDocument } from 'mongoose';
export type CrawlSourceDocument = HydratedDocument<CrawlSource>;
export declare const CrawlSourceModelName = "CrawlSource";
export declare class CrawlSource {
    url: string;
    name?: string;
    enabled: boolean;
    createdBy?: string;
    lastCrawledAt?: Date;
    lastError?: string;
}
export declare const CrawlSourceSchema: import("mongoose").Schema<CrawlSource, import("mongoose").Model<CrawlSource, any, any, any, any, any, CrawlSource>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, CrawlSource, import("mongoose").Document<unknown, {}, CrawlSource, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<CrawlSource & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    url?: import("mongoose").SchemaDefinitionProperty<string, CrawlSource, import("mongoose").Document<unknown, {}, CrawlSource, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<CrawlSource & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    name?: import("mongoose").SchemaDefinitionProperty<string | undefined, CrawlSource, import("mongoose").Document<unknown, {}, CrawlSource, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<CrawlSource & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    enabled?: import("mongoose").SchemaDefinitionProperty<boolean, CrawlSource, import("mongoose").Document<unknown, {}, CrawlSource, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<CrawlSource & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    createdBy?: import("mongoose").SchemaDefinitionProperty<string | undefined, CrawlSource, import("mongoose").Document<unknown, {}, CrawlSource, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<CrawlSource & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    lastCrawledAt?: import("mongoose").SchemaDefinitionProperty<Date | undefined, CrawlSource, import("mongoose").Document<unknown, {}, CrawlSource, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<CrawlSource & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    lastError?: import("mongoose").SchemaDefinitionProperty<string | undefined, CrawlSource, import("mongoose").Document<unknown, {}, CrawlSource, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<CrawlSource & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
}, CrawlSource>;
