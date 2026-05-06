import { z } from 'zod';

function emptyStringToUndefined(v: unknown) {
  if (typeof v === 'string' && v.trim() === '') return undefined;
  return v;
}

const EnvSchema = z.object({
  NODE_ENV: z.string().optional(),
  PORT: z.coerce.number().int().positive().optional(),
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  // Auth (Milestone 1)
  JWT_SECRET: z.string().min(1, 'JWT_SECRET is required'),
  JWT_EXPIRES_IN: z.string().min(1, 'JWT_EXPIRES_IN is required'),
  JWT_REFRESH_EXPIRES_IN: z
    .string()
    .min(1, 'JWT_REFRESH_EXPIRES_IN is required')
    .optional(),

  // AI service (Milestone 3)
  // Support both key names:
  // - AI_MODERATION_URL / AI_MODERATION_TIMEOUT_MS (preferred)
  // - AI_SERVICE_URL / AI_TIMEOUT_MS (legacy)
  AI_MODERATION_URL: z.string().url().optional(),
  AI_MODERATION_TIMEOUT_MS: z.coerce.number().int().positive().optional(),
  AI_SERVICE_URL: z.string().url().optional(),
  AI_TIMEOUT_MS: z.coerce.number().int().positive().optional(),
  AI_TOXIC_THRESHOLD: z.coerce.number().optional(),
  AI_VERSION: z.string().optional(),

  // Google login (Milestone 1)
  GOOGLE_CLIENT_ID: z.string().min(1, 'GOOGLE_CLIENT_ID is required'),

  // RSS import (Milestone 4)
  RSS_SOURCES: z.string().min(1).optional(),

  // VNPay (Milestone 7)
  VNPAY_TMN_CODE: z.string().min(1).optional(),
  VNPAY_SECURE_SECRET: z.string().min(1).optional(),
  VNPAY_TEST_MODE: z.preprocess(
    emptyStringToUndefined,
    z.enum(['true', 'false']).optional().default('true'),
  ),
  VNPAY_HOST: z.string().url().optional(),
  VNPAY_RETURN_URL: z.string().url().optional(),
  VNPAY_ENABLE_LOG: z.preprocess(
    emptyStringToUndefined,
    z.enum(['true', 'false']).optional().default('false'),
  ),

  // R2 (S3-compatible) Object Storage
  R2_ENDPOINT: z.string().url().optional(),
  R2_ACCESS_KEY_ID: z.string().min(1).optional(),
  R2_SECRET_ACCESS_KEY: z.string().min(1).optional(),
  R2_BUCKET: z.string().min(1).optional(),
  R2_PUBLIC_BASE_URL: z.string().url().optional(),

  // Matches (Milestone 10)
  MATCH_DATA_PROVIDER: z
    .enum(['pandascore', 'mock'])
    .optional()
    .default('pandascore'),
  PANDASCORE_TOKEN: z.string().min(1).optional(),
  MATCH_SYNC_INTERVAL_MS: z.coerce.number().int().positive().optional(),

  // Cloudinary (optional, when doing uploads)
  CLOUDINARY_CLOUD_NAME: z.string().min(1).optional(),
  CLOUDINARY_API_KEY: z.string().min(1).optional(),
  CLOUDINARY_API_SECRET: z.string().min(1).optional(),
});

export type Env = z.infer<typeof EnvSchema>;

export function validateEnv(raw: Record<string, unknown>): Env {
  return EnvSchema.parse(raw);
}
