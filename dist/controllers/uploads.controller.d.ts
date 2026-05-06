import type { JwtUser } from '../types/auth';
import { R2Service } from '../infra/r2/r2.service';
import { R2PresignDto } from '../dto/uploads/r2-presign.dto';
export declare class UploadsController {
    private readonly r2;
    constructor(r2: R2Service);
    presign(user: JwtUser, dto: R2PresignDto): Promise<{
        key: string;
        uploadUrl: string;
        publicUrl: string;
        expiresInSeconds: number;
    }>;
}
