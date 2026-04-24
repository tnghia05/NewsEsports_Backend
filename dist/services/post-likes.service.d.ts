import type { Model } from 'mongoose';
import { type PostLikeDocument } from '../models/post-like.model';
import { type PostDocument } from '../models/post.model';
import type { JwtUser } from '../types/auth';
import { NotificationsService } from './notifications.service';
export declare class PostLikesService {
    private readonly postLikeModel;
    private readonly postModel;
    private readonly notificationsService;
    constructor(postLikeModel: Model<PostLikeDocument>, postModel: Model<PostDocument>, notificationsService: NotificationsService);
    toggleLike(viewer: JwtUser, postId: string): Promise<{
        liked: boolean;
    }>;
}
