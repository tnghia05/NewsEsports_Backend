import { HashtagsService } from '../services/hashtags.service';
import { HotTopicsWorkerService } from '../services/hot-topics-worker.service';
import { QueryHashtagPostsDto } from '../dto/hashtags/query-hashtag-posts.dto';
import { TrendingHashtagsDto } from '../dto/hashtags/trending-hashtags.dto';
import { HotTopicsDto } from '../dto/hashtags/hot-topics.dto';
import { CreateHashtagEventDto } from '../dto/hashtags/create-hashtag-event.dto';
import type { JwtUser } from '../types/auth';
export declare class HashtagsController {
    private readonly hashtagsService;
    private readonly hotTopicsWorker;
    constructor(hashtagsService: HashtagsService, hotTopicsWorker: HotTopicsWorkerService);
    listPosts(tag: string, query: QueryHashtagPostsDto): Promise<{
        items: any[];
        page: number;
        limit: number;
    }>;
    trending(query: TrendingHashtagsDto): Promise<{
        window: "24h" | "7d";
        items: {
            tag: any;
            postCount: any;
            engagement: any;
            score: any;
            trend: any;
        }[];
    }>;
    createEvent(user: JwtUser | undefined, dto: CreateHashtagEventDto): Promise<{
        ok: boolean;
    }>;
    hotTopics(query: HotTopicsDto): Promise<{
        window: import("../models/hot-topic.model").HotTopicWindow;
        updatedAt: string | undefined;
        items: {
            rank: number;
            tag: any;
            hotness: any;
            components: any;
            trend: any;
        }[];
    }>;
    refreshHotTopics(): Promise<{
        triggered: boolean;
        message: string;
    }>;
    entityTrends(window?: string, limit?: string, type?: string): Promise<{
        window: import("../models/hot-topic.model").HotTopicWindow;
        items: {
            rank: number;
            entity: any;
            type: any;
            mentionCount: any;
            sentiment: any;
            toxicRate: any;
            intent: any;
        }[];
    }>;
}
