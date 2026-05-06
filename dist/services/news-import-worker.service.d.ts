import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Model } from 'mongoose';
import { type NewsDocument } from '../models/news.model';
import { RssService } from '../infra/rss/rss.service';
import { RssSourcesService } from './rss-sources.service';
export declare class NewsImportWorkerService implements OnModuleInit, OnModuleDestroy {
    private readonly config;
    private readonly newsModel;
    private readonly rssService;
    private readonly rssSourcesService;
    private readonly logger;
    private timer?;
    private running;
    private readonly intervalMs;
    private readonly maxItemsPerFeed;
    constructor(config: ConfigService, newsModel: Model<NewsDocument>, rssService: RssService, rssSourcesService: RssSourcesService);
    onModuleInit(): void;
    onModuleDestroy(): void;
    importNow(): Promise<{
        ok: boolean;
        imported: number;
        skipped: number;
        sources: number;
    }>;
    private tick;
    private getSourcesFromEnv;
    private getSources;
    private runImport;
    private tryCreateFromRss;
    private enrichFromExternalUrl;
}
