import type { JwtUser } from '../types/auth';
import { FollowsService } from '../services/follows.service';
export declare class UsersController {
    private readonly followsService;
    constructor(followsService: FollowsService);
    toggleFollow(user: JwtUser, followeeId: string): Promise<{
        following: boolean;
    }>;
}
