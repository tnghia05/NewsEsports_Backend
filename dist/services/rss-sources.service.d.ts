import type { Model } from 'mongoose';
import type { CreateRssSourceDto } from '../dto/rss/create-rss-source.dto';
import type { UpdateRssSourceDto } from '../dto/rss/update-rss-source.dto';
import { type RssSourceDocument } from '../models/rss-source.model';
import type { JwtUser } from '../types/auth';
export declare class RssSourcesService {
    private readonly rssSourceModel;
    constructor(rssSourceModel: Model<RssSourceDocument>);
    listAdmin(admin: JwtUser): Promise<(import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, import("../models/rss-source.model").RssSource, {}, import("mongoose").DefaultSchemaOptions> & import("../models/rss-source.model").RssSource & {
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
    listEnabledUrls(): Promise<string[]>;
    markImportResult(url: string, patch: {
        ok: boolean;
        error?: string;
    }): Promise<void>;
    private requireSource;
}
