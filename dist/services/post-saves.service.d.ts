import type { Model } from 'mongoose';
import { type PostSaveDocument } from '../models/post-save.model';
import { type PostDocument } from '../models/post.model';
import type { JwtUser } from '../types/auth';
export declare class PostSavesService {
    private readonly postSaveModel;
    private readonly postModel;
    constructor(postSaveModel: Model<PostSaveDocument>, postModel: Model<PostDocument>);
    toggleSave(viewer: JwtUser, postId: string): Promise<{
        saved: boolean;
    }>;
}
