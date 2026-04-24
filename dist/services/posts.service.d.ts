import type { Model } from 'mongoose';
import { type PostDocument } from '../models/post.model';
import { type PostLikeDocument } from '../models/post-like.model';
import { type PostSaveDocument } from '../models/post-save.model';
import type { JwtUser } from '../types/auth';
import type { CreatePostDto } from '../dto/posts/create-post.dto';
import type { UpdatePostDto } from '../dto/posts/update-post.dto';
import type { QueryPostsDto } from '../dto/posts/query-posts.dto';
import { FollowsService } from './follows.service';
export declare class PostsService {
    private readonly postModel;
    private readonly postLikeModel;
    private readonly postSaveModel;
    private readonly followsService;
    constructor(postModel: Model<PostDocument>, postLikeModel: Model<PostLikeDocument>, postSaveModel: Model<PostSaveDocument>, followsService: FollowsService);
    create(author: JwtUser, dto: CreatePostDto): Promise<import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, import("../models/post.model").Post, {}, import("mongoose").DefaultSchemaOptions> & import("../models/post.model").Post & {
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
    update(author: JwtUser, postId: string, dto: UpdatePostDto): Promise<import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, import("../models/post.model").Post, {}, import("mongoose").DefaultSchemaOptions> & import("../models/post.model").Post & {
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
    remove(author: JwtUser, postId: string): Promise<{
        ok: boolean;
    }>;
    getById(author: JwtUser | undefined, postId: string): Promise<(import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, import("../models/post.model").Post, {}, import("mongoose").DefaultSchemaOptions> & import("../models/post.model").Post & {
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
    list(author: JwtUser | undefined, query: QueryPostsDto): Promise<{
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
    listLikes(postId: string, opts: {
        page: number;
        limit: number;
    }): Promise<{
        items: {
            userId: any;
            createdAt: any;
        }[];
        page: number;
        limit: number;
        total: number;
        hasMore: boolean;
    }>;
    pin(postId: string): Promise<import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, import("../models/post.model").Post, {}, import("mongoose").DefaultSchemaOptions> & import("../models/post.model").Post & {
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
    unpin(postId: string): Promise<import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, import("../models/post.model").Post, {}, import("mongoose").DefaultSchemaOptions> & import("../models/post.model").Post & {
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
    private requirePost;
}
