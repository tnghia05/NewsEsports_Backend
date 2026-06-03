import type { Model } from 'mongoose';
import { type PostDocument } from '../models/post.model';
import { type UserDocument } from '../models/user.model';
import { type PostLikeDocument } from '../models/post-like.model';
import { type PostSaveDocument } from '../models/post-save.model';
import { type CommentDocument } from '../models/comment.model';
import { type PostCommentDigestDocument } from '../models/post-comment-digest.model';
import type { JwtUser } from '../types/auth';
import type { CreatePostDto } from '../dto/posts/create-post.dto';
import type { UpdatePostDto } from '../dto/posts/update-post.dto';
import type { QueryPostsDto } from '../dto/posts/query-posts.dto';
import type { QueryUserPostsDto } from '../dto/users/query-user-posts.dto';
import { FollowsService } from './follows.service';
import { PointsService } from './points.service';
export declare class PostsService {
    private readonly postModel;
    private readonly userModel;
    private readonly postLikeModel;
    private readonly postSaveModel;
    private readonly commentModel;
    private readonly digestModel;
    private readonly followsService;
    private readonly pointsService;
    private readonly logger;
    constructor(postModel: Model<PostDocument>, userModel: Model<UserDocument>, postLikeModel: Model<PostLikeDocument>, postSaveModel: Model<PostSaveDocument>, commentModel: Model<CommentDocument>, digestModel: Model<PostCommentDigestDocument>, followsService: FollowsService, pointsService: PointsService);
    private attachAuthors;
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
    getById(author: JwtUser | undefined, postId: string): Promise<any>;
    list(author: JwtUser | undefined, query: QueryPostsDto): Promise<{
        total?: number | undefined;
        hasMore?: boolean | undefined;
        items: any[];
        page: number;
        limit: number;
    }>;
    listByUser(viewer: JwtUser | undefined, userId: string, query: QueryUserPostsDto): Promise<{
        total?: number | undefined;
        hasMore?: boolean | undefined;
        items: any[];
        page: number;
        limit: number;
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
    getUserStats(userId: string): Promise<{
        postCount: number;
        commentCount: number;
        likeCount: number;
        savedCount: number;
    }>;
    private requirePost;
    getCommentDigest(postId: string, geminiApiKey?: string | null, force?: boolean): Promise<{
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
}
