import type { Model } from 'mongoose';
import { type FollowDocument } from '../models/follow.model';
export declare class FollowsService {
    private readonly followModel;
    constructor(followModel: Model<FollowDocument>);
    listFolloweeIds(followerId: string): Promise<string[]>;
    toggleFollow(followerId: string, followeeId: string): Promise<{
        following: boolean;
    }>;
}
