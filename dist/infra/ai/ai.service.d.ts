import { ConfigService } from '@nestjs/config';
import type { CommentSentiment } from '../../models/comment.model';
export type { Sentiment4Label, IntentLabel, AspectLabel, } from '../../types/ai-labels';
import type { Sentiment4Label, IntentLabel, AspectLabel } from '../../types/ai-labels';
export type AiModerationResult = {
    sentiment: CommentSentiment;
    toxicity: {
        isToxic: boolean;
        score: number;
    };
    sentiment4?: Sentiment4Label;
    intent?: IntentLabel;
    aspects?: AspectLabel[];
    sentiment4Scores?: Partial<Record<Sentiment4Label, number>>;
    intentScores?: Partial<Record<IntentLabel, number>>;
    aspectScores?: Partial<Record<AspectLabel, number>>;
    confidence?: number;
    entities?: {
        text: string;
        type: string;
    }[];
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
