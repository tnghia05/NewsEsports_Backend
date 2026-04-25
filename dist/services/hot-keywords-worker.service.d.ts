import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Model } from 'mongoose';
import { type SearchEventDocument } from '../models/search-event.model';
import { type HotKeywordDocument } from '../models/hot-keyword.model';
export declare class HotKeywordsWorkerService implements OnModuleInit, OnModuleDestroy {
    private readonly config;
    private readonly searchEventModel;
    private readonly hotKeywordModel;
    private readonly logger;
    private timer?;
    private running;
    private readonly intervalMs;
    constructor(config: ConfigService, searchEventModel: Model<SearchEventDocument>, hotKeywordModel: Model<HotKeywordDocument>);
    onModuleInit(): void;
    onModuleDestroy(): void;
    private tick;
    private recompute;
}
