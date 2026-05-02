import type { Model } from 'mongoose';
import type { CreateCrawlSourceDto } from '../dto/crawl/create-crawl-source.dto';
import type { UpdateCrawlSourceDto } from '../dto/crawl/update-crawl-source.dto';
import { type CrawlSourceDocument } from '../models/crawl-source.model';
import type { JwtUser } from '../types/auth';
export declare class CrawlSourcesService {
    private readonly crawlSourceModel;
    constructor(crawlSourceModel: Model<CrawlSourceDocument>);
    listAdmin(admin: JwtUser): Promise<(import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, import("../models/crawl-source.model").CrawlSource, {}, import("mongoose").DefaultSchemaOptions> & import("../models/crawl-source.model").CrawlSource & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    }, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").Document<unknown, {}, import("../models/crawl-source.model").CrawlSource, {}, import("mongoose").DefaultSchemaOptions> & import("../models/crawl-source.model").CrawlSource & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    } & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>)[]>;
    create(admin: JwtUser, dto: CreateCrawlSourceDto): Promise<import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, import("../models/crawl-source.model").CrawlSource, {}, import("mongoose").DefaultSchemaOptions> & import("../models/crawl-source.model").CrawlSource & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    }, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").Document<unknown, {}, import("../models/crawl-source.model").CrawlSource, {}, import("mongoose").DefaultSchemaOptions> & import("../models/crawl-source.model").CrawlSource & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    } & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>>;
    update(admin: JwtUser, id: string, dto: UpdateCrawlSourceDto): Promise<import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, import("../models/crawl-source.model").CrawlSource, {}, import("mongoose").DefaultSchemaOptions> & import("../models/crawl-source.model").CrawlSource & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    }, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").Document<unknown, {}, import("../models/crawl-source.model").CrawlSource, {}, import("mongoose").DefaultSchemaOptions> & import("../models/crawl-source.model").CrawlSource & {
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
    listEnabledUrls(): Promise<string[]>;
    markCrawlResult(url: string, patch: {
        ok: boolean;
        error?: string;
    }): Promise<void>;
    private requireSource;
}
