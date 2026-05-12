import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Model } from 'mongoose';
import { type CommentModerationJobDocument } from '../models/comment-moderation-job.model';
import { type CommentDocument } from '../models/comment.model';
import { type PostDocument } from '../models/post.model';
import { type NewsDocument } from '../models/news.model';
import { AiService } from '../infra/ai/ai.service';
import { NotificationsService } from './notifications.service';
export declare class CommentModerationWorkerService implements OnModuleInit, OnModuleDestroy {
    private readonly config;
    private readonly jobModel;
    private readonly commentModel;
    private readonly postModel;
    private readonly newsModel;
    private readonly aiService;
    private readonly notificationsService;
    private readonly logger;
    private timer?;
    private running;
    private readonly confidenceThreshold;
    private readonly toxicReviewThreshold;
    constructor(config: ConfigService, jobModel: Model<CommentModerationJobDocument>, commentModel: Model<CommentDocument>, postModel: Model<PostDocument>, newsModel: Model<NewsDocument>, aiService: AiService, notificationsService: NotificationsService);
    onModuleInit(): void;
    onModuleDestroy(): void;
    private tick;
    private claimJob;
    private processJob;
}
