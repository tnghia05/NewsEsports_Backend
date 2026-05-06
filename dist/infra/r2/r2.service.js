"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var R2Service_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.R2Service = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const crypto_1 = __importDefault(require("crypto"));
let R2Service = R2Service_1 = class R2Service {
    config;
    logger = new common_1.Logger(R2Service_1.name);
    client;
    bucket;
    publicBaseUrl;
    constructor(config) {
        this.config = config;
        const endpoint = this.config.get('R2_ENDPOINT', { infer: true });
        const accessKeyId = this.config.get('R2_ACCESS_KEY_ID', {
            infer: true,
        });
        const secretAccessKey = this.config.get('R2_SECRET_ACCESS_KEY', {
            infer: true,
        });
        this.bucket = this.config.get('R2_BUCKET', { infer: true });
        this.publicBaseUrl = this.config.get('R2_PUBLIC_BASE_URL', {
            infer: true,
        });
        if (!endpoint || !accessKeyId || !secretAccessKey || !this.bucket) {
            this.logger.warn('R2 disabled: missing R2_ENDPOINT/R2_ACCESS_KEY_ID/R2_SECRET_ACCESS_KEY/R2_BUCKET');
            return;
        }
        this.client = new client_s3_1.S3Client({
            region: 'auto',
            endpoint,
            credentials: { accessKeyId, secretAccessKey },
        });
        this.logger.log(`R2 enabled bucket=${this.bucket} endpoint=${redactEndpoint(endpoint)} publicBaseUrl=${this.publicBaseUrl ?? 'n/a'}`);
    }
    async presignPutObject(params) {
        if (!this.client || !this.bucket)
            throw new common_1.BadRequestException('R2 is not configured');
        if (!this.publicBaseUrl)
            throw new common_1.BadRequestException('R2_PUBLIC_BASE_URL is required');
        const safeName = sanitizeFileName(params.fileName);
        const ext = guessExtFromNameOrType(safeName, params.contentType);
        if (!isAllowedContentType(params.contentType)) {
            throw new common_1.BadRequestException('Unsupported contentType');
        }
        const date = new Date();
        const yyyy = String(date.getUTCFullYear());
        const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
        const rand = crypto_1.default.randomBytes(16).toString('hex');
        const uid = params.userId ? sanitizePathPart(params.userId) : 'anon';
        const key = `${params.folder}/${yyyy}/${mm}/${uid}/${rand}${ext ? `.${ext}` : ''}`;
        const cmd = new client_s3_1.PutObjectCommand({
            Bucket: this.bucket,
            Key: key,
            ContentType: params.contentType,
        });
        const uploadUrl = await (0, s3_request_presigner_1.getSignedUrl)(this.client, cmd, { expiresIn: 60 * 5 });
        const publicUrl = joinUrl(this.publicBaseUrl, key);
        return { key, uploadUrl, publicUrl, expiresInSeconds: 60 * 5 };
    }
};
exports.R2Service = R2Service;
exports.R2Service = R2Service = R2Service_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], R2Service);
function redactEndpoint(endpoint) {
    try {
        const u = new URL(endpoint);
        return `${u.protocol}//${u.host}`;
    }
    catch {
        return endpoint;
    }
}
function sanitizePathPart(input) {
    return input.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 80);
}
function sanitizeFileName(input) {
    const base = input.split(/[\\/]/).pop() ?? 'file';
    return base.replace(/[^\w.\- ]/g, '').trim().slice(0, 255) || 'file';
}
function guessExtFromNameOrType(fileName, contentType) {
    const m = fileName.toLowerCase().match(/\.([a-z0-9]{1,8})$/);
    if (m?.[1])
        return m[1];
    const map = {
        'image/jpeg': 'jpg',
        'image/png': 'png',
        'image/webp': 'webp',
        'image/gif': 'gif',
        'video/mp4': 'mp4',
        'video/webm': 'webm',
        'video/quicktime': 'mov',
    };
    return map[contentType.toLowerCase()] ?? '';
}
function isAllowedContentType(ct) {
    const t = ct.toLowerCase();
    return (t === 'image/jpeg' ||
        t === 'image/png' ||
        t === 'image/webp' ||
        t === 'image/gif' ||
        t === 'video/mp4' ||
        t === 'video/webm' ||
        t === 'video/quicktime');
}
function joinUrl(base, path) {
    return `${base.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
}
//# sourceMappingURL=r2.service.js.map