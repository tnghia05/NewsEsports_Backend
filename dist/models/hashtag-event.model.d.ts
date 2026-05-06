import type { HydratedDocument } from 'mongoose';
export type HashtagEventDocument = HydratedDocument<HashtagEvent>;
export declare const HashtagEventModelName = "HashtagEvent";
export type HashtagEventAction = 'view';
export declare class HashtagEvent {
    userId?: string;
    sessionId?: string;
    tag: string;
    action: HashtagEventAction;
}
export declare const HashtagEventSchema: import("mongoose").Schema<HashtagEvent, import("mongoose").Model<HashtagEvent, any, any, any, any, any, HashtagEvent>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, HashtagEvent, import("mongoose").Document<unknown, {}, HashtagEvent, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<HashtagEvent & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    userId?: import("mongoose").SchemaDefinitionProperty<string | undefined, HashtagEvent, import("mongoose").Document<unknown, {}, HashtagEvent, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<HashtagEvent & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    sessionId?: import("mongoose").SchemaDefinitionProperty<string | undefined, HashtagEvent, import("mongoose").Document<unknown, {}, HashtagEvent, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<HashtagEvent & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    tag?: import("mongoose").SchemaDefinitionProperty<string, HashtagEvent, import("mongoose").Document<unknown, {}, HashtagEvent, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<HashtagEvent & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    action?: import("mongoose").SchemaDefinitionProperty<"view", HashtagEvent, import("mongoose").Document<unknown, {}, HashtagEvent, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<HashtagEvent & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
}, HashtagEvent>;
