import type { Model } from 'mongoose';
import { type CommentLikeDocument } from '../models/comment-like.model';
import { type CommentDocument } from '../models/comment.model';
import { type PostDocument } from '../models/post.model';
import { type NewsDocument } from '../models/news.model';
import type { JwtUser } from '../types/auth';
export declare class CommentLikesService {
    private readonly commentLikeModel;
    private readonly commentModel;
    private readonly postModel;
    private readonly newsModel;
    constructor(commentLikeModel: Model<CommentLikeDocument>, commentModel: Model<CommentDocument>, postModel: Model<PostDocument>, newsModel: Model<NewsDocument>);
    toggleLike(viewer: JwtUser, commentId: string): Promise<{
        liked: boolean;
    }>;
}
