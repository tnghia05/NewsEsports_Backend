import type { HydratedDocument } from 'mongoose';
export type PostCommentDigestDocument = HydratedDocument<PostCommentDigest>;
export declare const PostCommentDigestModelName = "PostCommentDigest";
export declare class PostCommentDigest {
    postId: string;
    summary: string | null;
    aggregate: {
        commentCount: number;
        sentiment: {
            positive: number;
            neutral: number;
            negative: number;
        };
        sentiment4: {
            positive: number;
            negative: number;
            neutral: number;
            toxic: number;
        };
        intent: {
            praise: number;
            complain: number;
            question: number;
            other: number;
        };
        aspects: Record<string, number>;
        avgQualityScore: number;
        avgToxicityScore: number;
        toxicCount: number;
    };
    commentCount: number;
    lastCommentAt?: Date;
    generatedAt?: Date;
}
export declare const PostCommentDigestSchema: import("mongoose").Schema<PostCommentDigest, import("mongoose").Model<PostCommentDigest, any, any, any, any, any, PostCommentDigest>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, PostCommentDigest, import("mongoose").Document<unknown, {}, PostCommentDigest, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<PostCommentDigest & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    postId?: import("mongoose").SchemaDefinitionProperty<string, PostCommentDigest, import("mongoose").Document<unknown, {}, PostCommentDigest, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<PostCommentDigest & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    summary?: import("mongoose").SchemaDefinitionProperty<string | null, PostCommentDigest, import("mongoose").Document<unknown, {}, PostCommentDigest, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<PostCommentDigest & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    aggregate?: import("mongoose").SchemaDefinitionProperty<{
        commentCount: number;
        sentiment: {
            positive: number;
            neutral: number;
            negative: number;
        };
        sentiment4: {
            positive: number;
            negative: number;
            neutral: number;
            toxic: number;
        };
        intent: {
            praise: number;
            complain: number;
            question: number;
            other: number;
        };
        aspects: Record<string, number>;
        avgQualityScore: number;
        avgToxicityScore: number;
        toxicCount: number;
    }, PostCommentDigest, import("mongoose").Document<unknown, {}, PostCommentDigest, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<PostCommentDigest & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    commentCount?: import("mongoose").SchemaDefinitionProperty<number, PostCommentDigest, import("mongoose").Document<unknown, {}, PostCommentDigest, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<PostCommentDigest & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    lastCommentAt?: import("mongoose").SchemaDefinitionProperty<Date | undefined, PostCommentDigest, import("mongoose").Document<unknown, {}, PostCommentDigest, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<PostCommentDigest & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    generatedAt?: import("mongoose").SchemaDefinitionProperty<Date | undefined, PostCommentDigest, import("mongoose").Document<unknown, {}, PostCommentDigest, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<PostCommentDigest & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
}, PostCommentDigest>;
