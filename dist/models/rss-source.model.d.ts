import type { HydratedDocument } from 'mongoose';
export type RssSourceDocument = HydratedDocument<RssSource>;
export declare const RssSourceModelName = "RssSource";
export declare class RssSource {
    url: string;
    name?: string;
    enabled: boolean;
    createdBy?: string;
    lastImportedAt?: Date;
    lastError?: string;
}
export declare const RssSourceSchema: import("mongoose").Schema<RssSource, import("mongoose").Model<RssSource, any, any, any, any, any, RssSource>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, RssSource, import("mongoose").Document<unknown, {}, RssSource, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<RssSource & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    url?: import("mongoose").SchemaDefinitionProperty<string, RssSource, import("mongoose").Document<unknown, {}, RssSource, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<RssSource & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    name?: import("mongoose").SchemaDefinitionProperty<string | undefined, RssSource, import("mongoose").Document<unknown, {}, RssSource, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<RssSource & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    enabled?: import("mongoose").SchemaDefinitionProperty<boolean, RssSource, import("mongoose").Document<unknown, {}, RssSource, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<RssSource & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    createdBy?: import("mongoose").SchemaDefinitionProperty<string | undefined, RssSource, import("mongoose").Document<unknown, {}, RssSource, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<RssSource & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    lastImportedAt?: import("mongoose").SchemaDefinitionProperty<Date | undefined, RssSource, import("mongoose").Document<unknown, {}, RssSource, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<RssSource & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    lastError?: import("mongoose").SchemaDefinitionProperty<string | undefined, RssSource, import("mongoose").Document<unknown, {}, RssSource, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<RssSource & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
}, RssSource>;
