import { z } from 'zod';
declare const EnvSchema: z.ZodObject<{
    NODE_ENV: z.ZodOptional<z.ZodString>;
    PORT: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    MONGODB_URI: z.ZodString;
    JWT_SECRET: z.ZodString;
    JWT_EXPIRES_IN: z.ZodString;
    AI_SERVICE_URL: z.ZodOptional<z.ZodString>;
    AI_TIMEOUT_MS: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    GOOGLE_CLIENT_ID: z.ZodString;
    RSS_SOURCES: z.ZodOptional<z.ZodString>;
    CLOUDINARY_CLOUD_NAME: z.ZodOptional<z.ZodString>;
    CLOUDINARY_API_KEY: z.ZodOptional<z.ZodString>;
    CLOUDINARY_API_SECRET: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type Env = z.infer<typeof EnvSchema>;
export declare function validateEnv(raw: Record<string, unknown>): Env;
export {};
