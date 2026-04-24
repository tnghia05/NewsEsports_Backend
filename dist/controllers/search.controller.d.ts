import { SearchService } from '../services/search.service';
import { SearchPostsDto } from '../dto/search/search-posts.dto';
import { SearchUsersDto } from '../dto/search/search-users.dto';
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
}
