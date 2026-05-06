import type { JwtUser } from '../types/auth';
import { NewsService } from '../services/news.service';
import { NewsImportWorkerService } from '../services/news-import-worker.service';
import { NewsCrawlWorkerService } from '../services/news-crawl-worker.service';
import { CreateNewsDto } from '../dto/news/create-news.dto';
import { UpdateNewsDto } from '../dto/news/update-news.dto';
import { QueryNewsDto } from '../dto/news/query-news.dto';
import { BulkDeleteNewsDto } from '../dto/news/bulk-delete-news.dto';
export declare class NewsController {
    private readonly newsService;
    private readonly newsImportWorkerService;
    private readonly newsCrawlWorkerService;
    constructor(newsService: NewsService, newsImportWorkerService: NewsImportWorkerService, newsCrawlWorkerService: NewsCrawlWorkerService);
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
    bulkRemove(admin: JwtUser, dto: BulkDeleteNewsDto): Promise<{
        ok: boolean;
        deleted: number;
    }>;
    importRss(): Promise<{
        ok: boolean;
        imported: number;
        skipped: number;
        sources: number;
    }>;
    crawlNow(): Promise<{
        ok: boolean;
        sources: number;
        imported: number;
        skipped: number;
    }>;
}
