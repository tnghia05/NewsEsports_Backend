import type { JwtUser } from '../types/auth';
import { CommentsService } from '../services/comments.service';
import { QueryCommentsDto } from '../dto/comments/query-comments.dto';
import { CreateCommentDto } from '../dto/comments/create-comment.dto';
import { UpdateCommentDto } from '../dto/comments/update-comment.dto';
export declare class CommentsController {
    private readonly commentsService;
    constructor(commentsService: CommentsService);
    listForPost(user: JwtUser | undefined, postId: string, query: QueryCommentsDto): Promise<{
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
    createForPost(user: JwtUser, postId: string, body: CreateCommentDto): Promise<import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, import("../models/comment.model").Comment, {}, import("mongoose").DefaultSchemaOptions> & import("../models/comment.model").Comment & {
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
    update(user: JwtUser, id: string, body: UpdateCommentDto): Promise<import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, import("../models/comment.model").Comment, {}, import("mongoose").DefaultSchemaOptions> & import("../models/comment.model").Comment & {
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
    remove(user: JwtUser, id: string): Promise<{
        ok: boolean;
    }>;
}
