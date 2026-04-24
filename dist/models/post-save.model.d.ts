import type { HydratedDocument } from 'mongoose';
export type PostSaveDocument = HydratedDocument<PostSave>;
export declare const PostSaveModelName = "PostSave";
export declare class PostSave {
    postId: string;
    userId: string;
}
export declare const PostSaveSchema: import("mongoose").Schema<PostSave, import("mongoose").Model<PostSave, any, any, any, any, any, PostSave>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, PostSave, import("mongoose").Document<unknown, {}, PostSave, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<PostSave & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    postId?: import("mongoose").SchemaDefinitionProperty<string, PostSave, import("mongoose").Document<unknown, {}, PostSave, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<PostSave & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    userId?: import("mongoose").SchemaDefinitionProperty<string, PostSave, import("mongoose").Document<unknown, {}, PostSave, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<PostSave & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
}, PostSave>;
