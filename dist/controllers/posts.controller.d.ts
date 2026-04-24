import { PostsService } from '../services/posts.service';
import type { JwtUser } from '../types/auth';
import { CreatePostDto } from '../dto/posts/create-post.dto';
import { UpdatePostDto } from '../dto/posts/update-post.dto';
import { QueryPostsDto } from '../dto/posts/query-posts.dto';
export declare class PostsController {
    private readonly postsService;
    constructor(postsService: PostsService);
    list(user: JwtUser | undefined, query: QueryPostsDto): Promise<{
        items: any[];
        page: number;
        limit: number;
    }>;
    getById(user: JwtUser | undefined, id: string): Promise<import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, import("../models/post.model").Post, {}, import("mongoose").DefaultSchemaOptions> & import("../models/post.model").Post & {
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
}
