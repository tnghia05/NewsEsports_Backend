import type { HydratedDocument } from 'mongoose';
export type NewsDocument = HydratedDocument<News>;
export declare const NewsModelName = "News";
export type NewsStatus = 'draft' | 'published';
export type NewsSource = 'admin' | 'rss' | 'crawl';
export declare class News {
    title: string;
    slug: string;
    excerpt?: string;
    content: string;
    coverImageUrl?: string;
    tags: string[];
    status: NewsStatus;
    publishedAt?: Date;
    source: NewsSource;
    authorId?: string;
    sourceUrl?: string;
    externalUrl?: string;
    externalId?: string;
}
export declare const NewsSchema: import("mongoose").Schema<News, import("mongoose").Model<News, any, any, any, any, any, News>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, News, import("mongoose").Document<unknown, {}, News, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<News & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    title?: import("mongoose").SchemaDefinitionProperty<string, News, import("mongoose").Document<unknown, {}, News, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<News & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    slug?: import("mongoose").SchemaDefinitionProperty<string, News, import("mongoose").Document<unknown, {}, News, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<News & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    excerpt?: import("mongoose").SchemaDefinitionProperty<string | undefined, News, import("mongoose").Document<unknown, {}, News, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<News & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    content?: import("mongoose").SchemaDefinitionProperty<string, News, import("mongoose").Document<unknown, {}, News, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<News & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    coverImageUrl?: import("mongoose").SchemaDefinitionProperty<string | undefined, News, import("mongoose").Document<unknown, {}, News, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<News & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    tags?: import("mongoose").SchemaDefinitionProperty<string[], News, import("mongoose").Document<unknown, {}, News, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<News & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    status?: import("mongoose").SchemaDefinitionProperty<NewsStatus, News, import("mongoose").Document<unknown, {}, News, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<News & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    publishedAt?: import("mongoose").SchemaDefinitionProperty<Date | undefined, News, import("mongoose").Document<unknown, {}, News, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<News & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    source?: import("mongoose").SchemaDefinitionProperty<NewsSource, News, import("mongoose").Document<unknown, {}, News, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<News & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    authorId?: import("mongoose").SchemaDefinitionProperty<string | undefined, News, import("mongoose").Document<unknown, {}, News, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<News & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    sourceUrl?: import("mongoose").SchemaDefinitionProperty<string | undefined, News, import("mongoose").Document<unknown, {}, News, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<News & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    externalUrl?: import("mongoose").SchemaDefinitionProperty<string | undefined, News, import("mongoose").Document<unknown, {}, News, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<News & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    externalId?: import("mongoose").SchemaDefinitionProperty<string | undefined, News, import("mongoose").Document<unknown, {}, News, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<News & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
}, News>;
