import type { Model } from 'mongoose';
import { type PostLikeDocument } from '../models/post-like.model';
import { type PostDocument } from '../models/post.model';
import type { JwtUser } from '../types/auth';
export declare class PostLikesService {
    private readonly postLikeModel;
    private readonly postModel;
    constructor(postLikeModel: Model<PostLikeDocument>, postModel: Model<PostDocument>);
    toggleLike(viewer: JwtUser, postId: string): Promise<{
        liked: boolean;
    }>;
}
