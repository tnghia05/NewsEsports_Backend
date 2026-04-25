import type { JwtUser } from '../types/auth';
import { CreateRssSourceDto } from '../dto/rss/create-rss-source.dto';
import { UpdateRssSourceDto } from '../dto/rss/update-rss-source.dto';
import { RssSourcesService } from '../services/rss-sources.service';
export declare class RssSourcesController {
    private readonly rssSourcesService;
    constructor(rssSourcesService: RssSourcesService);
    list(admin: JwtUser): Promise<(import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, import("../models/rss-source.model").RssSource, {}, import("mongoose").DefaultSchemaOptions> & import("../models/rss-source.model").RssSource & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    }, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").Document<unknown, {}, import("../models/rss-source.model").RssSource, {}, import("mongoose").DefaultSchemaOptions> & import("../models/rss-source.model").RssSource & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    } & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>)[]>;
    create(admin: JwtUser, dto: CreateRssSourceDto): Promise<import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, import("../models/rss-source.model").RssSource, {}, import("mongoose").DefaultSchemaOptions> & import("../models/rss-source.model").RssSource & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    }, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").Document<unknown, {}, import("../models/rss-source.model").RssSource, {}, import("mongoose").DefaultSchemaOptions> & import("../models/rss-source.model").RssSource & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    } & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>>;
    update(admin: JwtUser, id: string, dto: UpdateRssSourceDto): Promise<import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, import("../models/rss-source.model").RssSource, {}, import("mongoose").DefaultSchemaOptions> & import("../models/rss-source.model").RssSource & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    }, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").Document<unknown, {}, import("../models/rss-source.model").RssSource, {}, import("mongoose").DefaultSchemaOptions> & import("../models/rss-source.model").RssSource & {
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
