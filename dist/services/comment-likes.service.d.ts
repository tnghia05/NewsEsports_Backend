import type { Model } from 'mongoose';
import { type CommentLikeDocument } from '../models/comment-like.model';
import { type CommentDocument } from '../models/comment.model';
import { type PostDocument } from '../models/post.model';
import type { JwtUser } from '../types/auth';
export declare class CommentLikesService {
    private readonly commentLikeModel;
    private readonly commentModel;
    private readonly postModel;
    constructor(commentLikeModel: Model<CommentLikeDocument>, commentModel: Model<CommentDocument>, postModel: Model<PostDocument>);
    toggleLike(viewer: JwtUser, commentId: string): Promise<{
        liked: boolean;
    }>;
}
