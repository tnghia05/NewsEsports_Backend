import { z } from 'zod';
declare const EnvSchema: z.ZodObject<{
    NODE_ENV: z.ZodOptional<z.ZodString>;
    PORT: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    MONGODB_URI: z.ZodString;
    JWT_SECRET: z.ZodString;
    JWT_EXPIRES_IN: z.ZodString;
    JWT_REFRESH_EXPIRES_IN: z.ZodOptional<z.ZodString>;
    AI_MODERATION_URL: z.ZodPipe<z.ZodTransform<unknown, unknown>, z.ZodOptional<z.ZodString>>;
    AI_MODERATION_TIMEOUT_MS: z.ZodPipe<z.ZodTransform<unknown, unknown>, z.ZodOptional<z.ZodCoercedNumber<unknown>>>;
    AI_SERVICE_URL: z.ZodPipe<z.ZodTransform<unknown, unknown>, z.ZodOptional<z.ZodString>>;
    AI_TIMEOUT_MS: z.ZodPipe<z.ZodTransform<unknown, unknown>, z.ZodOptional<z.ZodCoercedNumber<unknown>>>;
    AI_TOXIC_THRESHOLD: z.ZodPipe<z.ZodTransform<unknown, unknown>, z.ZodOptional<z.ZodCoercedNumber<unknown>>>;
    AI_VERSION: z.ZodPipe<z.ZodTransform<unknown, unknown>, z.ZodOptional<z.ZodString>>;
    GEMINI_API_KEY: z.ZodPipe<z.ZodTransform<unknown, unknown>, z.ZodOptional<z.ZodString>>;
    GOOGLE_CLIENT_ID: z.ZodString;
    RSS_SOURCES: z.ZodOptional<z.ZodString>;
    VNPAY_TMN_CODE: z.ZodOptional<z.ZodString>;
    VNPAY_SECURE_SECRET: z.ZodOptional<z.ZodString>;
    VNPAY_TEST_MODE: z.ZodPipe<z.ZodTransform<unknown, unknown>, z.ZodDefault<z.ZodOptional<z.ZodEnum<{
        true: "true";
        false: "false";
    }>>>>;
    VNPAY_HOST: z.ZodOptional<z.ZodString>;
    VNPAY_RETURN_URL: z.ZodOptional<z.ZodString>;
    VNPAY_ENABLE_LOG: z.ZodPipe<z.ZodTransform<unknown, unknown>, z.ZodDefault<z.ZodOptional<z.ZodEnum<{
        true: "true";
        false: "false";
    }>>>>;
    R2_ENDPOINT: z.ZodOptional<z.ZodString>;
    R2_ACCESS_KEY_ID: z.ZodOptional<z.ZodString>;
    R2_SECRET_ACCESS_KEY: z.ZodOptional<z.ZodString>;
    R2_BUCKET: z.ZodOptional<z.ZodString>;
    R2_PUBLIC_BASE_URL: z.ZodOptional<z.ZodString>;
    MATCH_DATA_PROVIDER: z.ZodDefault<z.ZodOptional<z.ZodEnum<{
        pandascore: "pandascore";
        mock: "mock";
    }>>>;
    PANDASCORE_TOKEN: z.ZodOptional<z.ZodString>;
    MATCH_SYNC_INTERVAL_MS: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    CLOUDINARY_CLOUD_NAME: z.ZodOptional<z.ZodString>;
    CLOUDINARY_API_KEY: z.ZodOptional<z.ZodString>;
    CLOUDINARY_API_SECRET: z.ZodOptional<z.ZodString>;
    KALSTROP_CLIENT_ID: z.ZodOptional<z.ZodString>;
    KALSTROP_SHARED_SECRET: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type Env = z.infer<typeof EnvSchema>;
export declare function validateEnv(raw: Record<string, unknown>): Env;
export {};
