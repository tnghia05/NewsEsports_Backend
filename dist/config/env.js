"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateEnv = validateEnv;
const zod_1 = require("zod");
function emptyStringToUndefined(v) {
    if (typeof v === 'string' && v.trim() === '')
        return undefined;
    return v;
}
const EnvSchema = zod_1.z.object({
    NODE_ENV: zod_1.z.string().optional(),
    PORT: zod_1.z.coerce.number().int().positive().optional(),
    MONGODB_URI: zod_1.z.string().min(1, 'MONGODB_URI is required'),
    JWT_SECRET: zod_1.z.string().min(1, 'JWT_SECRET is required'),
    JWT_EXPIRES_IN: zod_1.z.string().min(1, 'JWT_EXPIRES_IN is required'),
    JWT_REFRESH_EXPIRES_IN: zod_1.z
        .string()
        .min(1, 'JWT_REFRESH_EXPIRES_IN is required')
        .optional(),
    AI_MODERATION_URL: zod_1.z.string().url().optional(),
    AI_MODERATION_TIMEOUT_MS: zod_1.z.coerce.number().int().positive().optional(),
    AI_SERVICE_URL: zod_1.z.string().url().optional(),
    AI_TIMEOUT_MS: zod_1.z.coerce.number().int().positive().optional(),
    AI_TOXIC_THRESHOLD: zod_1.z.coerce.number().optional(),
    AI_VERSION: zod_1.z.string().optional(),
    GOOGLE_CLIENT_ID: zod_1.z.string().min(1, 'GOOGLE_CLIENT_ID is required'),
    RSS_SOURCES: zod_1.z.string().min(1).optional(),
    VNPAY_TMN_CODE: zod_1.z.string().min(1).optional(),
    VNPAY_SECURE_SECRET: zod_1.z.string().min(1).optional(),
    VNPAY_TEST_MODE: zod_1.z.preprocess(emptyStringToUndefined, zod_1.z.enum(['true', 'false']).optional().default('true')),
    VNPAY_HOST: zod_1.z.string().url().optional(),
    VNPAY_RETURN_URL: zod_1.z.string().url().optional(),
    VNPAY_ENABLE_LOG: zod_1.z.preprocess(emptyStringToUndefined, zod_1.z.enum(['true', 'false']).optional().default('false')),
    R2_ENDPOINT: zod_1.z.string().url().optional(),
    R2_ACCESS_KEY_ID: zod_1.z.string().min(1).optional(),
    R2_SECRET_ACCESS_KEY: zod_1.z.string().min(1).optional(),
    R2_BUCKET: zod_1.z.string().min(1).optional(),
    R2_PUBLIC_BASE_URL: zod_1.z.string().url().optional(),
    MATCH_DATA_PROVIDER: zod_1.z
        .enum(['pandascore', 'mock'])
        .optional()
        .default('pandascore'),
    PANDASCORE_TOKEN: zod_1.z.string().min(1).optional(),
    MATCH_SYNC_INTERVAL_MS: zod_1.z.coerce.number().int().positive().optional(),
    CLOUDINARY_CLOUD_NAME: zod_1.z.string().min(1).optional(),
    CLOUDINARY_API_KEY: zod_1.z.string().min(1).optional(),
    CLOUDINARY_API_SECRET: zod_1.z.string().min(1).optional(),
});
function validateEnv(raw) {
    return EnvSchema.parse(raw);
}
//# sourceMappingURL=env.js.map