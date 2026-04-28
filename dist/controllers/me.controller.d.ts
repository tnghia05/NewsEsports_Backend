import type { JwtUser } from '../types/auth';
import { PostsService } from '../services/posts.service';
export declare class MeController {
    private readonly postsService;
    constructor(postsService: PostsService);
    me(user: JwtUser): JwtUser;
    savedPosts(user: JwtUser): Promise<{
        total?: number | undefined;
        hasMore?: boolean | undefined;
        items: any[];
        page: number;
        limit: number;
    }>;
}
