import { ConfigService } from '@nestjs/config';
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
    private readonly config;
    constructor(postsService: PostsService, postLikesService: PostLikesService, postSavesService: PostSavesService, config: ConfigService);
    list(user: JwtUser | undefined, query: QueryPostsDto): Promise<{
        total?: number | undefined;
        hasMore?: boolean | undefined;
        items: any[];
        page: number;
        limit: number;
    }>;
    getById(user: JwtUser | undefined, id: string): Promise<any>;
    getCommentDigest(id: string, force?: string): Promise<{
        summary: null;
        aggregate: null;
        commentCount: number;
        cached: boolean;
    } | {
        summary: string | null;
        aggregate: {
            commentCount: number;
            sentiment: {
                positive: number;
                neutral: number;
                negative: number;
            };
            sentiment4: {
                positive: number;
                negative: number;
                neutral: number;
                toxic: number;
            };
            intent: {
                praise: number;
                complain: number;
                question: number;
                other: number;
            };
            aspects: Record<string, number>;
            avgQualityScore: number;
            avgToxicityScore: number;
            toxicCount: number;
        };
        commentCount: number;
        cached: boolean;
    }>;
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
