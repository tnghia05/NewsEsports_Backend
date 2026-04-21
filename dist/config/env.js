"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateEnv = validateEnv;
const zod_1 = require("zod");
const EnvSchema = zod_1.z.object({
    NODE_ENV: zod_1.z.string().optional(),
    PORT: zod_1.z.coerce.number().int().positive().optional(),
    MONGODB_URI: zod_1.z.string().min(1, 'MONGODB_URI is required'),
    JWT_SECRET: zod_1.z.string().min(1).optional(),
    JWT_EXPIRES_IN: zod_1.z.string().min(1).optional(),
    AI_SERVICE_URL: zod_1.z.string().url().optional(),
    AI_TIMEOUT_MS: zod_1.z.coerce.number().int().positive().optional(),
    RSS_SOURCES: zod_1.z.string().min(1).optional(),
    CLOUDINARY_CLOUD_NAME: zod_1.z.string().min(1).optional(),
    CLOUDINARY_API_KEY: zod_1.z.string().min(1).optional(),
    CLOUDINARY_API_SECRET: zod_1.z.string().min(1).optional(),
});
function validateEnv(raw) {
    return EnvSchema.parse(raw);
}
//# sourceMappingURL=env.js.map