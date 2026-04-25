import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import type { Model } from 'mongoose';
import { type CommentModerationJobDocument } from '../models/comment-moderation-job.model';
import { type CommentDocument } from '../models/comment.model';
import { type PostDocument } from '../models/post.model';
import { AiService } from '../infra/ai/ai.service';
import { NotificationsService } from './notifications.service';
export declare class CommentModerationWorkerService implements OnModuleInit, OnModuleDestroy {
    private readonly jobModel;
    private readonly commentModel;
    private readonly postModel;
    private readonly aiService;
    private readonly notificationsService;
    private readonly logger;
    private timer?;
    private running;
    constructor(jobModel: Model<CommentModerationJobDocument>, commentModel: Model<CommentDocument>, postModel: Model<PostDocument>, aiService: AiService, notificationsService: NotificationsService);
    onModuleInit(): void;
    onModuleDestroy(): void;
    private tick;
    private claimJob;
    private processJob;
}
