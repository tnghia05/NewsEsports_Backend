import type { JwtUser } from '../types/auth';
import { PostsService } from '../services/posts.service';
export declare class MeController {
    private readonly postsService;
    constructor(postsService: PostsService);
    me(user: JwtUser): JwtUser;
    savedPosts(user: JwtUser): Promise<{
        items: any[];
        page: number;
        limit: number;
    } | {
        items: {
            likedByMe: boolean;
            savedByMe: boolean;
            authorId: string;
            title: string;
            content: string;
            thumbnailUrl?: string;
            game: string;
            tournament?: string;
            tags: string[];
            status: "draft" | "published";
            viewCount: number;
            commentCount: number;
            likeCount: number;
            isPinned: boolean;
            pinnedAt?: Date;
            _id: import("mongoose").Types.ObjectId;
            __v: number;
        }[];
        page: number;
        limit: number;
        total: number;
        hasMore: boolean;
    }>;
}
