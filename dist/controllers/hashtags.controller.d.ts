import { HashtagsService } from '../services/hashtags.service';
import { QueryHashtagPostsDto } from '../dto/hashtags/query-hashtag-posts.dto';
import { TrendingHashtagsDto } from '../dto/hashtags/trending-hashtags.dto';
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
}
