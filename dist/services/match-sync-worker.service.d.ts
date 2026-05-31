import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Model } from 'mongoose';
import { type MatchDocument } from '../models/match.model';
import { PandaScoreService } from '../infra/pandascore/pandascore.service';
import { PredictionsService } from './predictions.service';
export declare class MatchSyncWorkerService implements OnModuleInit, OnModuleDestroy {
    private readonly config;
    private readonly matchModel;
    private readonly pandaScore;
    private readonly predictions;
    private readonly logger;
    private timer?;
    private running;
    private readonly intervalMs;
    private readonly provider;
    constructor(config: ConfigService, matchModel: Model<MatchDocument>, pandaScore: PandaScoreService, predictions: PredictionsService);
    onModuleInit(): void;
    onModuleDestroy(): void;
    syncNow(): Promise<{
        ok: boolean;
        error: string;
        upserted?: undefined;
        provider?: undefined;
    } | {
        ok: boolean;
        upserted: number;
        provider: string;
        error?: undefined;
    }>;
    private tick;
    private runSync;
    private autoSettle;
    private fetchFromPandaScore;
}
