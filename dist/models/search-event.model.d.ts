import type { HydratedDocument } from 'mongoose';
export type SearchEventDocument = HydratedDocument<SearchEvent>;
export declare const SearchEventModelName = "SearchEvent";
export type SearchEventAction = 'search' | 'click';
export declare class SearchEvent {
    userId?: string;
    sessionId?: string;
    q: string;
    action: SearchEventAction;
    targetId?: string;
}
export declare const SearchEventSchema: import("mongoose").Schema<SearchEvent, import("mongoose").Model<SearchEvent, any, any, any, any, any, SearchEvent>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, SearchEvent, import("mongoose").Document<unknown, {}, SearchEvent, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<SearchEvent & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    userId?: import("mongoose").SchemaDefinitionProperty<string | undefined, SearchEvent, import("mongoose").Document<unknown, {}, SearchEvent, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<SearchEvent & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    sessionId?: import("mongoose").SchemaDefinitionProperty<string | undefined, SearchEvent, import("mongoose").Document<unknown, {}, SearchEvent, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<SearchEvent & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    q?: import("mongoose").SchemaDefinitionProperty<string, SearchEvent, import("mongoose").Document<unknown, {}, SearchEvent, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<SearchEvent & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    action?: import("mongoose").SchemaDefinitionProperty<SearchEventAction, SearchEvent, import("mongoose").Document<unknown, {}, SearchEvent, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<SearchEvent & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    targetId?: import("mongoose").SchemaDefinitionProperty<string | undefined, SearchEvent, import("mongoose").Document<unknown, {}, SearchEvent, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<SearchEvent & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
}, SearchEvent>;
