import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Model } from 'mongoose';
import { AiService } from '../infra/ai/ai.service';
import { type PostDocument } from '../models/post.model';
import { type CommentDocument } from '../models/comment.model';
import { type HashtagEventDocument } from '../models/hashtag-event.model';
import { type HotTopicDocument } from '../models/hot-topic.model';
export declare class HotTopicsWorkerService implements OnModuleInit, OnModuleDestroy {
    private readonly config;
    private readonly aiService;
    private readonly postModel;
    private readonly commentModel;
    private readonly hashtagEventModel;
    private readonly hotTopicModel;
    private readonly logger;
    private timer?;
    private running;
    private readonly intervalMs;
    private readonly topN;
    private readonly sampleN;
    constructor(config: ConfigService, aiService: AiService, postModel: Model<PostDocument>, commentModel: Model<CommentDocument>, hashtagEventModel: Model<HashtagEventDocument>, hotTopicModel: Model<HotTopicDocument>);
    onModuleInit(): void;
    onModuleDestroy(): void;
    private tick;
    private recompute;
    private computeTrendForTag;
}
