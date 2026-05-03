import type { HydratedDocument } from 'mongoose';
export type CommentDocument = HydratedDocument<Comment>;
export declare const CommentModelName = "Comment";
export type CommentModerationStatus = 'pending' | 'approved' | 'rejected';
export type CommentSentiment = 'positive' | 'neutral' | 'negative';
export declare class Comment {
    postId?: string;
    newsId?: string;
    parentId?: string;
    authorId: string;
    content: string;
    moderationStatus: CommentModerationStatus;
    sentiment?: CommentSentiment;
    toxicity?: {
        isToxic: boolean;
        score: number;
    };
    sentiment4?: string;
    intent?: string;
    aspects?: string[];
    sentiment4Scores?: Record<string, number>;
    intentScores?: Record<string, number>;
    aspectScores?: Record<string, number>;
    aiVersion?: string;
    aiError?: string;
    likeCount: number;
    isDeleted: boolean;
    deletedAt?: Date;
}
export declare const CommentSchema: import("mongoose").Schema<Comment, import("mongoose").Model<Comment, any, any, any, any, any, Comment>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Comment, import("mongoose").Document<unknown, {}, Comment, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<Comment & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    postId?: import("mongoose").SchemaDefinitionProperty<string | undefined, Comment, import("mongoose").Document<unknown, {}, Comment, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Comment & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    newsId?: import("mongoose").SchemaDefinitionProperty<string | undefined, Comment, import("mongoose").Document<unknown, {}, Comment, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Comment & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    parentId?: import("mongoose").SchemaDefinitionProperty<string | undefined, Comment, import("mongoose").Document<unknown, {}, Comment, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Comment & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    authorId?: import("mongoose").SchemaDefinitionProperty<string, Comment, import("mongoose").Document<unknown, {}, Comment, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Comment & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    content?: import("mongoose").SchemaDefinitionProperty<string, Comment, import("mongoose").Document<unknown, {}, Comment, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Comment & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    moderationStatus?: import("mongoose").SchemaDefinitionProperty<CommentModerationStatus, Comment, import("mongoose").Document<unknown, {}, Comment, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Comment & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    sentiment?: import("mongoose").SchemaDefinitionProperty<CommentSentiment | undefined, Comment, import("mongoose").Document<unknown, {}, Comment, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Comment & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    toxicity?: import("mongoose").SchemaDefinitionProperty<{
        isToxic: boolean;
        score: number;
    } | undefined, Comment, import("mongoose").Document<unknown, {}, Comment, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Comment & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    sentiment4?: import("mongoose").SchemaDefinitionProperty<string | undefined, Comment, import("mongoose").Document<unknown, {}, Comment, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Comment & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    intent?: import("mongoose").SchemaDefinitionProperty<string | undefined, Comment, import("mongoose").Document<unknown, {}, Comment, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Comment & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    aspects?: import("mongoose").SchemaDefinitionProperty<string[] | undefined, Comment, import("mongoose").Document<unknown, {}, Comment, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Comment & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    sentiment4Scores?: import("mongoose").SchemaDefinitionProperty<Record<string, number> | undefined, Comment, import("mongoose").Document<unknown, {}, Comment, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Comment & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    intentScores?: import("mongoose").SchemaDefinitionProperty<Record<string, number> | undefined, Comment, import("mongoose").Document<unknown, {}, Comment, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Comment & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    aspectScores?: import("mongoose").SchemaDefinitionProperty<Record<string, number> | undefined, Comment, import("mongoose").Document<unknown, {}, Comment, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Comment & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    aiVersion?: import("mongoose").SchemaDefinitionProperty<string | undefined, Comment, import("mongoose").Document<unknown, {}, Comment, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Comment & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    aiError?: import("mongoose").SchemaDefinitionProperty<string | undefined, Comment, import("mongoose").Document<unknown, {}, Comment, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Comment & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    likeCount?: import("mongoose").SchemaDefinitionProperty<number, Comment, import("mongoose").Document<unknown, {}, Comment, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Comment & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    isDeleted?: import("mongoose").SchemaDefinitionProperty<boolean, Comment, import("mongoose").Document<unknown, {}, Comment, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Comment & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    deletedAt?: import("mongoose").SchemaDefinitionProperty<Date | undefined, Comment, import("mongoose").Document<unknown, {}, Comment, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Comment & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
}, Comment>;
