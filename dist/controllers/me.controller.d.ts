import type { JwtUser } from '../types/auth';
import { PostsService } from '../services/posts.service';
import { UsersService } from '../services/users.service';
export declare class MeController {
    private readonly postsService;
    private readonly usersService;
    constructor(postsService: PostsService, usersService: UsersService);
    me(user: JwtUser): JwtUser;
    updateProfile(user: JwtUser, body: {
        displayName?: string;
        avatarUrl?: string;
    }): Promise<{
        id: string;
        email: string | undefined;
        displayName: string | undefined;
        avatarUrl: string | undefined;
        role: "user" | "admin" | undefined;
        points: number | undefined;
    }>;
    getMeStats(user: JwtUser): Promise<{
        postCount: number;
        commentCount: number;
        likeCount: number;
        savedCount: number;
    }>;
    savedPosts(user: JwtUser): Promise<{
        total?: number | undefined;
        hasMore?: boolean | undefined;
        items: any[];
        page: number;
        limit: number;
    }>;
}
