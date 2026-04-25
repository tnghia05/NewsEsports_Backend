import type { Model } from 'mongoose';
import type { CreateNewsDto } from '../dto/news/create-news.dto';
import type { QueryNewsDto } from '../dto/news/query-news.dto';
import type { UpdateNewsDto } from '../dto/news/update-news.dto';
import { type NewsDocument } from '../models/news.model';
import type { JwtUser } from '../types/auth';
export declare class NewsService {
    private readonly newsModel;
    constructor(newsModel: Model<NewsDocument>);
    create(admin: JwtUser, dto: CreateNewsDto): Promise<import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, import("../models/news.model").News, {}, import("mongoose").DefaultSchemaOptions> & import("../models/news.model").News & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    }, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").Document<unknown, {}, import("../models/news.model").News, {}, import("mongoose").DefaultSchemaOptions> & import("../models/news.model").News & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    } & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>>;
    update(admin: JwtUser, id: string, dto: UpdateNewsDto): Promise<import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, import("../models/news.model").News, {}, import("mongoose").DefaultSchemaOptions> & import("../models/news.model").News & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    }, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").Document<unknown, {}, import("../models/news.model").News, {}, import("mongoose").DefaultSchemaOptions> & import("../models/news.model").News & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    } & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>>;
    remove(admin: JwtUser, id: string): Promise<{
        ok: boolean;
    }>;
    getPublicBySlug(slug: string): Promise<import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, import("../models/news.model").News, {}, import("mongoose").DefaultSchemaOptions> & import("../models/news.model").News & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    }, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").Document<unknown, {}, import("../models/news.model").News, {}, import("mongoose").DefaultSchemaOptions> & import("../models/news.model").News & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    } & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>>;
    getPublicById(id: string): Promise<import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, import("../models/news.model").News, {}, import("mongoose").DefaultSchemaOptions> & import("../models/news.model").News & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    }, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").Document<unknown, {}, import("../models/news.model").News, {}, import("mongoose").DefaultSchemaOptions> & import("../models/news.model").News & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    } & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>>;
    listPublic(query: QueryNewsDto): Promise<{
        items: (import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, import("../models/news.model").News, {}, import("mongoose").DefaultSchemaOptions> & import("../models/news.model").News & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        } & {
            id: string;
        }, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").Document<unknown, {}, import("../models/news.model").News, {}, import("mongoose").DefaultSchemaOptions> & import("../models/news.model").News & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        } & {
            id: string;
        } & Required<{
            _id: import("mongoose").Types.ObjectId;
        }>)[];
        page: number;
        limit: number;
        total: number;
        hasMore: boolean;
    }>;
    listAdmin(admin: JwtUser, query: QueryNewsDto): Promise<{
        items: (import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, import("../models/news.model").News, {}, import("mongoose").DefaultSchemaOptions> & import("../models/news.model").News & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        } & {
            id: string;
        }, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").Document<unknown, {}, import("../models/news.model").News, {}, import("mongoose").DefaultSchemaOptions> & import("../models/news.model").News & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        } & {
            id: string;
        } & Required<{
            _id: import("mongoose").Types.ObjectId;
        }>)[];
        page: number;
        limit: number;
        total: number;
        hasMore: boolean;
    }>;
    private requireNews;
}
