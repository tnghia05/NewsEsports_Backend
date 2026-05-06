import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Model } from 'mongoose';
import { type NewsDocument } from '../models/news.model';
import { CrawlSourcesService } from './crawl-sources.service';
export declare class NewsCrawlWorkerService implements OnModuleInit, OnModuleDestroy {
    private readonly config;
    private readonly newsModel;
    private readonly crawlSourcesService;
    private readonly logger;
    private timer?;
    private running;
    private readonly intervalMs;
    private readonly maxLinksPerSource;
    constructor(config: ConfigService, newsModel: Model<NewsDocument>, crawlSourcesService: CrawlSourcesService);
    onModuleInit(): void;
    onModuleDestroy(): void;
    crawlNow(): Promise<{
        ok: boolean;
        sources: number;
        imported: number;
        skipped: number;
    }>;
    private tick;
    private runCrawl;
    private fetchListingLinks;
    private tryCreateFromCrawl;
    private enrichFromExternalUrl;
}
