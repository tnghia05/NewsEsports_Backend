import { ConfigService } from '@nestjs/config';
export declare class R2Service {
    private readonly config;
    private readonly logger;
    private readonly client?;
    private readonly bucket?;
    private readonly publicBaseUrl?;
    constructor(config: ConfigService);
    presignPutObject(params: {
        fileName: string;
        contentType: string;
        folder: string;
        userId?: string;
    }): Promise<{
        key: string;
        uploadUrl: string;
        publicUrl: string;
        expiresInSeconds: number;
    }>;
}
