import type { HydratedDocument } from 'mongoose';
export type CommentModerationJobDocument = HydratedDocument<CommentModerationJob>;
export declare const CommentModerationJobModelName = "CommentModerationJob";
export type ModerationJobStatus = 'pending' | 'processing' | 'done' | 'failed';
export declare class CommentModerationJob {
    commentId: string;
    status: ModerationJobStatus;
    attempts: number;
    nextRunAt?: Date;
    lockedAt?: Date;
    lastError?: string;
}
export declare const CommentModerationJobSchema: import("mongoose").Schema<CommentModerationJob, import("mongoose").Model<CommentModerationJob, any, any, any, any, any, CommentModerationJob>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, CommentModerationJob, import("mongoose").Document<unknown, {}, CommentModerationJob, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<CommentModerationJob & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    commentId?: import("mongoose").SchemaDefinitionProperty<string, CommentModerationJob, import("mongoose").Document<unknown, {}, CommentModerationJob, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<CommentModerationJob & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    status?: import("mongoose").SchemaDefinitionProperty<ModerationJobStatus, CommentModerationJob, import("mongoose").Document<unknown, {}, CommentModerationJob, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<CommentModerationJob & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    attempts?: import("mongoose").SchemaDefinitionProperty<number, CommentModerationJob, import("mongoose").Document<unknown, {}, CommentModerationJob, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<CommentModerationJob & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    nextRunAt?: import("mongoose").SchemaDefinitionProperty<Date | undefined, CommentModerationJob, import("mongoose").Document<unknown, {}, CommentModerationJob, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<CommentModerationJob & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    lockedAt?: import("mongoose").SchemaDefinitionProperty<Date | undefined, CommentModerationJob, import("mongoose").Document<unknown, {}, CommentModerationJob, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<CommentModerationJob & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    lastError?: import("mongoose").SchemaDefinitionProperty<string | undefined, CommentModerationJob, import("mongoose").Document<unknown, {}, CommentModerationJob, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<CommentModerationJob & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
}, CommentModerationJob>;
