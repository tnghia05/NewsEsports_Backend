import type { Model } from 'mongoose';
import { type FollowDocument } from '../models/follow.model';
import { type UserDocument } from '../models/user.model';
import { NotificationsService } from './notifications.service';
export declare class FollowsService {
    private readonly followModel;
    private readonly userModel;
    private readonly notificationsService;
    constructor(followModel: Model<FollowDocument>, userModel: Model<UserDocument>, notificationsService: NotificationsService);
    listFolloweeIds(followerId: string): Promise<string[]>;
    toggleFollow(followerId: string, followeeId: string): Promise<{
        following: boolean;
    }>;
    isFollowing(followerId: string, followeeId: string): Promise<boolean>;
    listFollowers(followeeId: string, opts: {
        page: number;
        limit: number;
    }): Promise<{
        items: {
            id: string;
            displayName: string;
            avatarUrl?: string;
        }[];
        page: number;
        limit: number;
        total: number;
        hasMore: boolean;
    }>;
    listFollowing(followerId: string, opts: {
        page: number;
        limit: number;
    }): Promise<{
        items: {
            id: string;
            displayName: string;
            avatarUrl?: string;
        }[];
        page: number;
        limit: number;
        total: number;
        hasMore: boolean;
    }>;
    getFollowStats(userId: string): Promise<{
        followersCount: number;
        followingCount: number;
    }>;
}
