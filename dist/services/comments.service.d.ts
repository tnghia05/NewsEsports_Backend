import type { Model } from 'mongoose';
import { type CommentDocument } from '../models/comment.model';
import { type PostDocument } from '../models/post.model';
import { type NewsDocument } from '../models/news.model';
import type { JwtUser } from '../types/auth';
import type { QueryCommentsDto } from '../dto/comments/query-comments.dto';
import type { CreateCommentDto } from '../dto/comments/create-comment.dto';
import type { UpdateCommentDto } from '../dto/comments/update-comment.dto';
import { NotificationsService } from './notifications.service';
import { PointsService } from './points.service';
import { type CommentModerationJobDocument } from '../models/comment-moderation-job.model';
export declare class CommentsService {
    private readonly commentModel;
    private readonly postModel;
    private readonly newsModel;
    private readonly notificationsService;
    private readonly jobModel;
    private readonly pointsService;
    private readonly logger;
    constructor(commentModel: Model<CommentDocument>, postModel: Model<PostDocument>, newsModel: Model<NewsDocument>, notificationsService: NotificationsService, jobModel: Model<CommentModerationJobDocument>, pointsService: PointsService);
    listForPost(viewer: JwtUser | undefined, postId: string, query: QueryCommentsDto): Promise<{
        items: (import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, import("../models/comment.model").Comment, {}, import("mongoose").DefaultSchemaOptions> & import("../models/comment.model").Comment & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        } & {
            id: string;
        }, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").Document<unknown, {}, import("../models/comment.model").Comment, {}, import("mongoose").DefaultSchemaOptions> & import("../models/comment.model").Comment & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        } & {
            id: string;
        } & Required<{
            _id: import("mongoose").Types.ObjectId;
        }>)[];
        page: number;
        limit: number;
        total: number;
        hasMore: boolean;
    }>;
    listForNews(viewer: JwtUser | undefined, newsId: string, query: QueryCommentsDto): Promise<{
        items: (import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, import("../models/comment.model").Comment, {}, import("mongoose").DefaultSchemaOptions> & import("../models/comment.model").Comment & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        } & {
            id: string;
        }, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").Document<unknown, {}, import("../models/comment.model").Comment, {}, import("mongoose").DefaultSchemaOptions> & import("../models/comment.model").Comment & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        } & {
            id: string;
        } & Required<{
            _id: import("mongoose").Types.ObjectId;
        }>)[];
        page: number;
        limit: number;
        total: number;
        hasMore: boolean;
    }>;
    private applyModerationFilter;
    listReplies(viewer: JwtUser | undefined, commentId: string, query: QueryCommentsDto): Promise<{
        items: (import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, import("../models/comment.model").Comment, {}, import("mongoose").DefaultSchemaOptions> & import("../models/comment.model").Comment & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        } & {
            id: string;
        }, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").Document<unknown, {}, import("../models/comment.model").Comment, {}, import("mongoose").DefaultSchemaOptions> & import("../models/comment.model").Comment & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        } & {
            id: string;
        } & Required<{
            _id: import("mongoose").Types.ObjectId;
        }>)[];
        page: number;
        limit: number;
        total: number;
        hasMore: boolean;
    }>;
    createForPost(viewer: JwtUser, postId: string, dto: CreateCommentDto): Promise<import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, import("../models/comment.model").Comment, {}, import("mongoose").DefaultSchemaOptions> & import("../models/comment.model").Comment & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    }, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").Document<unknown, {}, import("../models/comment.model").Comment, {}, import("mongoose").DefaultSchemaOptions> & import("../models/comment.model").Comment & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    } & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>>;
    createForNews(viewer: JwtUser, newsId: string, dto: CreateCommentDto): Promise<import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, import("../models/comment.model").Comment, {}, import("mongoose").DefaultSchemaOptions> & import("../models/comment.model").Comment & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    }, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").Document<unknown, {}, import("../models/comment.model").Comment, {}, import("mongoose").DefaultSchemaOptions> & import("../models/comment.model").Comment & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    } & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>>;
    private enqueueModerationJob;
    update(viewer: JwtUser, commentId: string, dto: UpdateCommentDto): Promise<import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, import("../models/comment.model").Comment, {}, import("mongoose").DefaultSchemaOptions> & import("../models/comment.model").Comment & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    }, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").Document<unknown, {}, import("../models/comment.model").Comment, {}, import("mongoose").DefaultSchemaOptions> & import("../models/comment.model").Comment & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    } & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>>;
    remove(viewer: JwtUser, commentId: string): Promise<{
        ok: boolean;
    }>;
    private decrementApprovedCommentTarget;
    private requireComment;
    private requirePost;
    private requirePublishedNews;
}
