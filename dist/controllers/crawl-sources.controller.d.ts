import type { JwtUser } from '../types/auth';
import { CreateCrawlSourceDto } from '../dto/crawl/create-crawl-source.dto';
import { UpdateCrawlSourceDto } from '../dto/crawl/update-crawl-source.dto';
import { CrawlSourcesService } from '../services/crawl-sources.service';
export declare class CrawlSourcesController {
    private readonly crawlSourcesService;
    constructor(crawlSourcesService: CrawlSourcesService);
    list(admin: JwtUser): Promise<(import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, import("../models/crawl-source.model").CrawlSource, {}, import("mongoose").DefaultSchemaOptions> & import("../models/crawl-source.model").CrawlSource & {
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
}
