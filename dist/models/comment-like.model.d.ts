import type { HydratedDocument } from 'mongoose';
export type CommentLikeDocument = HydratedDocument<CommentLike>;
export declare const CommentLikeModelName = "CommentLike";
export declare class CommentLike {
    commentId: string;
    userId: string;
}
export declare const CommentLikeSchema: import("mongoose").Schema<CommentLike, import("mongoose").Model<CommentLike, any, any, any, any, any, CommentLike>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, CommentLike, import("mongoose").Document<unknown, {}, CommentLike, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<CommentLike & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    commentId?: import("mongoose").SchemaDefinitionProperty<string, CommentLike, import("mongoose").Document<unknown, {}, CommentLike, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<CommentLike & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    userId?: import("mongoose").SchemaDefinitionProperty<string, CommentLike, import("mongoose").Document<unknown, {}, CommentLike, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<CommentLike & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
}, CommentLike>;
