import type { JwtUser } from '../types/auth';
import { FollowsService } from '../services/follows.service';
import { PostsService } from '../services/posts.service';
import { UsersService } from '../services/users.service';
import { QueryUserPostsDto } from '../dto/users/query-user-posts.dto';
import { QueryFollowDto } from '../dto/users/query-follow.dto';
export declare class UsersController {
    private readonly followsService;
    private readonly postsService;
    private readonly usersService;
    constructor(followsService: FollowsService, postsService: PostsService, usersService: UsersService);
    toggleFollow(user: JwtUser, followeeId: string): Promise<{
        following: boolean;
    }>;
    getUserProfile(viewer: JwtUser | undefined, userId: string): Promise<{
        id: string;
        displayName: string;
        avatarUrl: string | undefined;
        role: "user" | "admin";
        points: number;
        createdAt: Date | undefined;
        postCount: number;
        followersCount: number;
        followingCount: number;
        isFollowing: boolean;
    }>;
    listUserPosts(viewer: JwtUser | undefined, userId: string, query: QueryUserPostsDto): Promise<{
        following: boolean;
        total?: number | undefined;
        hasMore?: boolean | undefined;
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
