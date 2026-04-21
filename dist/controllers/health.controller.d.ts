import { HealthService } from '../services/health.service';
export declare class HealthController {
    private readonly healthService;
    constructor(healthService: HealthService);
    getHealth(): {
        status: string;
        timestamp: string;
    };
}
