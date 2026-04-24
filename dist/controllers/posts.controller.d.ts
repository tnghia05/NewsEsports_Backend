import { PostsService } from '../services/posts.service';
import type { JwtUser } from '../types/auth';
import { CreatePostDto } from '../dto/posts/create-post.dto';
import { UpdatePostDto } from '../dto/posts/update-post.dto';
import { QueryPostsDto } from '../dto/posts/query-posts.dto';
import { PostLikesService } from '../services/post-likes.service';
import { PostSavesService } from '../services/post-saves.service';
export declare class PostsController {
    private readonly postsService;
    private readonly postLikesService;
    private readonly postSavesService;
    constructor(postsService: PostsService, postLikesService: PostLikesService, postSavesService: PostSavesService);
    list(user: JwtUser | undefined, query: QueryPostsDto): Promise<{
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
    getById(user: JwtUser | undefined, id: string): Promise<(import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, import("../models/post.model").Post, {}, import("mongoose").DefaultSchemaOptions> & import("../models/post.model").Post & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    }, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").Document<unknown, {}, import("../models/post.model").Post, {}, import("mongoose").DefaultSchemaOptions> & import("../models/post.model").Post & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    } & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>) | (import("mongoose").Document<unknown, {}, import("../models/post.model").Post, {}, import("mongoose").DefaultSchemaOptions> & import("../models/post.model").Post & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    } & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        likedByMe: boolean;
        savedByMe: boolean;
    })>;
    create(user: JwtUser, body: CreatePostDto): Promise<import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, import("../models/post.model").Post, {}, import("mongoose").DefaultSchemaOptions> & import("../models/post.model").Post & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    }, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").Document<unknown, {}, import("../models/post.model").Post, {}, import("mongoose").DefaultSchemaOptions> & import("../models/post.model").Post & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    } & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>>;
    update(user: JwtUser, id: string, body: UpdatePostDto): Promise<import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, import("../models/post.model").Post, {}, import("mongoose").DefaultSchemaOptions> & import("../models/post.model").Post & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    }, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").Document<unknown, {}, import("../models/post.model").Post, {}, import("mongoose").DefaultSchemaOptions> & import("../models/post.model").Post & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    } & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>>;
    remove(user: JwtUser, id: string): Promise<{
        ok: boolean;
    }>;
    toggleLike(user: JwtUser, id: string): Promise<{
        liked: boolean;
    }>;
    toggleSave(user: JwtUser, id: string): Promise<{
        saved: boolean;
    }>;
    getLikes(id: string, page?: string, limit?: string): Promise<{
        items: {
            userId: any;
            createdAt: any;
        }[];
        page: number;
        limit: number;
        total: number;
        hasMore: boolean;
    }>;
    pin(id: string): Promise<import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, import("../models/post.model").Post, {}, import("mongoose").DefaultSchemaOptions> & import("../models/post.model").Post & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    }, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").Document<unknown, {}, import("../models/post.model").Post, {}, import("mongoose").DefaultSchemaOptions> & import("../models/post.model").Post & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    } & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>>;
    unpin(id: string): Promise<import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, import("../models/post.model").Post, {}, import("mongoose").DefaultSchemaOptions> & import("../models/post.model").Post & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    }, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").Document<unknown, {}, import("../models/post.model").Post, {}, import("mongoose").DefaultSchemaOptions> & import("../models/post.model").Post & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    } & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>>;
}
