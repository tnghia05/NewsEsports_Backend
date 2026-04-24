import type { HydratedDocument } from 'mongoose';
export type FollowDocument = HydratedDocument<Follow>;
export declare const FollowModelName = "Follow";
export declare class Follow {
    followerId: string;
    followeeId: string;
}
export declare const FollowSchema: import("mongoose").Schema<Follow, import("mongoose").Model<Follow, any, any, any, any, any, Follow>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Follow, import("mongoose").Document<unknown, {}, Follow, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<Follow & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    followerId?: import("mongoose").SchemaDefinitionProperty<string, Follow, import("mongoose").Document<unknown, {}, Follow, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Follow & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    followeeId?: import("mongoose").SchemaDefinitionProperty<string, Follow, import("mongoose").Document<unknown, {}, Follow, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Follow & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
}, Follow>;
