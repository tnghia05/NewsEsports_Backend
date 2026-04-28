import { HashtagsService } from '../services/hashtags.service';
import { QueryHashtagPostsDto } from '../dto/hashtags/query-hashtag-posts.dto';
import { TrendingHashtagsDto } from '../dto/hashtags/trending-hashtags.dto';
import { HotTopicsDto } from '../dto/hashtags/hot-topics.dto';
import { CreateHashtagEventDto } from '../dto/hashtags/create-hashtag-event.dto';
import type { JwtUser } from '../types/auth';
export declare class HashtagsController {
    private readonly hashtagsService;
    constructor(hashtagsService: HashtagsService);
    listPosts(tag: string, query: QueryHashtagPostsDto): Promise<{
        items: any[];
        page: number;
        limit: number;
    }>;
    trending(query: TrendingHashtagsDto): Promise<{
        window: "24h" | "7d";
        items: any[];
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
}
