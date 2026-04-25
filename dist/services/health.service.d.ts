import type { Model } from 'mongoose';
import { type CommentModerationJobDocument } from '../models/comment-moderation-job.model';
import { type CommentDocument } from '../models/comment.model';
export declare class HealthService {
    private readonly commentModel;
    private readonly jobModel;
    constructor(commentModel: Model<CommentDocument>, jobModel: Model<CommentModerationJobDocument>);
    getHealth(): Promise<{
        status: string;
        timestamp: string;
        moderation: {
            comments: {
                pending: number;
                approved: number;
                rejected: number;
            };
            jobs: {
                pending: number;
                failed: number;
            };
        };
    }>;
}
