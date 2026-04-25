import { ConfigService } from '@nestjs/config';
import type { CommentSentiment } from '../../models/comment.model';
export type AiModerationResult = {
    sentiment: CommentSentiment;
    toxicity: {
        isToxic: boolean;
        score: number;
    };
    aiVersion?: string;
};
export declare class AiService {
    private readonly config;
    private readonly logger;
    private readonly url?;
    private readonly timeoutMs;
    private readonly toxicThreshold;
    private readonly version?;
    constructor(config: ConfigService);
    analyzeComment(text: string): Promise<AiModerationResult>;
}
