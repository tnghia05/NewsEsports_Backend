import type { Model } from 'mongoose';
import { type CommentDocument } from '../models/comment.model';
import { type PostDocument } from '../models/post.model';
import { type AdminAlertDocument } from '../models/admin-alert.model';
import { type UserDocument } from '../models/user.model';
import { type NewsDocument } from '../models/news.model';
import { NotificationsService } from './notifications.service';
export declare class AiStatsService {
    private readonly commentModel;
    private readonly postModel;
    private readonly alertModel;
    private readonly userModel;
    private readonly newsModel;
    private readonly notificationsService;
    constructor(commentModel: Model<CommentDocument>, postModel: Model<PostDocument>, alertModel: Model<AdminAlertDocument>, userModel: Model<UserDocument>, newsModel: Model<NewsDocument>, notificationsService: NotificationsService);
    getDashboardOverview(): Promise<{
        users: {
            total: number;
            today: number;
        };
        posts: {
            total: number;
            today: number;
        };
        comments: {
            total: number;
            today: number;
        };
        moderation: {
            pendingReview: number;
            queue: number;
        };
        activity7d: {
            date: string;
            posts: number;
            comments: number;
        }[];
    }>;
    getModerationStats(days?: number): Promise<{
        date: string;
    }[]>;
    getSentiment4Distribution(): Promise<{
        label: any;
        count: number;
        ratio: number;
    }[]>;
    getToxicRateByGame(): Promise<{
        game: any;
        total: number;
        toxic: number;
        toxicRate: number;
    }[]>;
    getRecentAlerts(opts: {
        limit: number;
        unreadOnly: boolean;
    }): Promise<{
        id: string;
        type: any;
        tag: any;
        ratio3h: any;
        ratio24h: any;
        isRead: any;
        createdAt: any;
    }[]>;
    markAlertRead(alertId: string): Promise<{
        ok: boolean;
    }>;
    getUnderReviewComments(opts: {
        page: number;
        limit: number;
    }): Promise<{
        items: {
            id: string;
            postId: any;
            newsId: any;
            authorId: any;
            content: any;
            confidence: number | undefined;
            sentiment4: any;
            intent: any;
            toxicityScore: any;
            createdAt: any;
        }[];
        page: number;
        limit: number;
        total: number;
        hasMore: boolean;
    }>;
    reviewComment(commentId: string, decision: 'approved' | 'rejected'): Promise<{
        ok: boolean;
    }>;
}
