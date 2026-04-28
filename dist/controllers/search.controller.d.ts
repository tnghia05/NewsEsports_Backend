import { SearchService } from '../services/search.service';
import { SearchPostsDto } from '../dto/search/search-posts.dto';
import { SearchUsersDto } from '../dto/search/search-users.dto';
import { CreateSearchEventDto } from '../dto/search/create-search-event.dto';
import type { JwtUser } from '../types/auth';
export declare class SearchController {
    private readonly searchService;
    constructor(searchService: SearchService);
    searchPosts(query: SearchPostsDto): Promise<{
        items: any[];
        page: number;
        limit: number;
    }>;
    searchUsers(query: SearchUsersDto): Promise<{
        items: {
            id: string;
            displayName: any;
            avatarUrl: any;
        }[];
        page: number;
        limit: number;
    }>;
    createEvent(user: JwtUser | undefined, dto: CreateSearchEventDto): Promise<{
        ok: boolean;
    }>;
    hot(window?: string, limit?: string): Promise<{
        window: import("../models/hot-keyword.model").HotKeywordWindow;
        updatedAt: string | undefined;
        items: {
            rank: number;
            keyword: any;
            score: any;
        }[];
    }>;
    trends(window?: string, limit?: string): Promise<{
        window: import("../models/hot-keyword.model").HotKeywordWindow;
        items: {
            keyword: any;
            score: any;
            trend: any;
        }[];
    }>;
    suggest(q?: string, limit?: string): Promise<{
        items: any[];
    }>;
}
