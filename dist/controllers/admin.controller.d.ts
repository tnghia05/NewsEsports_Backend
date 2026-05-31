import { AiStatsService } from '../services/ai-stats.service';
import { AiService } from '../infra/ai/ai.service';
export declare class AdminController {
    private readonly aiStatsService;
    private readonly aiService;
    constructor(aiStatsService: AiStatsService, aiService: AiService);
    getOverview(): Promise<{
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
    getModerationStats(days: number): Promise<{
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
    getAlerts(limit: number, unreadOnly?: string): Promise<{
        id: string;
        type: any;
        tag: any;
        ratio3h: any;
        ratio24h: any;
        isRead: any;
        createdAt: any;
    }[]>;
    markAlertRead(id: string): Promise<{
        ok: boolean;
    }>;
    getUnderReviewComments(page: number, limit: number): Promise<{
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
    testModeration(text: string): Promise<import("../infra/ai/ai.service").AiModerationResult | {
        error: string;
    }>;
}
