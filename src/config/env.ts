import { z } from 'zod';

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
  AI_SERVICE_URL: z.string().url().optional(),
  AI_TIMEOUT_MS: z.coerce.number().int().positive().optional(),
  AI_TOXIC_THRESHOLD: z.coerce.number().min(0).max(1).optional(),
  AI_VERSION: z.string().min(1).optional(),

  // Google login (Milestone 1)
  GOOGLE_CLIENT_ID: z.string().min(1, 'GOOGLE_CLIENT_ID is required'),

  // RSS import (Milestone 4)
  RSS_SOURCES: z.string().min(1).optional(),

  // Cloudinary (optional, when doing uploads)
  CLOUDINARY_CLOUD_NAME: z.string().min(1).optional(),
  CLOUDINARY_API_KEY: z.string().min(1).optional(),
  CLOUDINARY_API_SECRET: z.string().min(1).optional(),
});

export type Env = z.infer<typeof EnvSchema>;

export function validateEnv(raw: Record<string, unknown>): Env {
  return EnvSchema.parse(raw);
}
