import type { HydratedDocument } from 'mongoose';
export type PostLikeDocument = HydratedDocument<PostLike>;
export declare const PostLikeModelName = "PostLike";
export declare class PostLike {
    postId: string;
    userId: string;
}
export declare const PostLikeSchema: import("mongoose").Schema<PostLike, import("mongoose").Model<PostLike, any, any, any, any, any, PostLike>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, PostLike, import("mongoose").Document<unknown, {}, PostLike, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<PostLike & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    postId?: import("mongoose").SchemaDefinitionProperty<string, PostLike, import("mongoose").Document<unknown, {}, PostLike, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<PostLike & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    userId?: import("mongoose").SchemaDefinitionProperty<string, PostLike, import("mongoose").Document<unknown, {}, PostLike, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<PostLike & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
}, PostLike>;
