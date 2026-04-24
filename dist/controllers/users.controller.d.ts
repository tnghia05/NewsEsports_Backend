import type { JwtUser } from '../types/auth';
import { FollowsService } from '../services/follows.service';
import { PostsService } from '../services/posts.service';
import { QueryUserPostsDto } from '../dto/users/query-user-posts.dto';
import { QueryFollowDto } from '../dto/users/query-follow.dto';
export declare class UsersController {
    private readonly followsService;
    private readonly postsService;
    constructor(followsService: FollowsService, postsService: PostsService);
    toggleFollow(user: JwtUser, followeeId: string): Promise<{
        following: boolean;
    }>;
    listUserPosts(viewer: JwtUser | undefined, userId: string, query: QueryUserPostsDto): Promise<{
        following: boolean;
        total: number;
        hasMore: boolean;
        items: any[];
        page: number;
        limit: number;
    }>;
    followers(userId: string, query: QueryFollowDto): Promise<{
        items: {
            id: string;
            displayName: string;
            avatarUrl?: string;
        }[];
        page: number;
        limit: number;
        total: number;
        hasMore: boolean;
    }>;
    following(userId: string, query: QueryFollowDto): Promise<{
        items: {
            id: string;
            displayName: string;
            avatarUrl?: string;
        }[];
        page: number;
        limit: number;
        total: number;
        hasMore: boolean;
    }>;
}
