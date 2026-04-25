import { HealthService } from '../services/health.service';
export declare class HealthController {
    private readonly healthService;
    constructor(healthService: HealthService);
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
