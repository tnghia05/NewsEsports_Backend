import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import crypto from 'crypto';

@Injectable()
export class R2Service {
  private readonly logger = new Logger(R2Service.name);
  private readonly client?: S3Client;
  private readonly bucket?: string;
  private readonly publicBaseUrl?: string;

  constructor(private readonly config: ConfigService) {
    const endpoint = this.config.get<string>('R2_ENDPOINT', { infer: true });
    const accessKeyId = this.config.get<string>('R2_ACCESS_KEY_ID', {
      infer: true,
    });
    const secretAccessKey = this.config.get<string>('R2_SECRET_ACCESS_KEY', {
      infer: true,
    });
    this.bucket = this.config.get<string>('R2_BUCKET', { infer: true });
    this.publicBaseUrl = this.config.get<string>('R2_PUBLIC_BASE_URL', {
      infer: true,
    });

    if (!endpoint || !accessKeyId || !secretAccessKey || !this.bucket) {
      this.logger.warn('R2 disabled: missing R2_ENDPOINT/R2_ACCESS_KEY_ID/R2_SECRET_ACCESS_KEY/R2_BUCKET');
      return;
    }

    this.client = new S3Client({
      region: 'auto',
      endpoint,
      credentials: { accessKeyId, secretAccessKey },
    });

    this.logger.log(`R2 enabled bucket=${this.bucket} endpoint=${redactEndpoint(endpoint)} publicBaseUrl=${this.publicBaseUrl ?? 'n/a'}`);
  }

  async presignPutObject(params: {
    fileName: string;
    contentType: string;
    folder: string;
    userId?: string;
  }) {
    if (!this.client || !this.bucket) throw new BadRequestException('R2 is not configured');
    if (!this.publicBaseUrl)
      throw new BadRequestException('R2_PUBLIC_BASE_URL is required');

    const safeName = sanitizeFileName(params.fileName);
    const ext = guessExtFromNameOrType(safeName, params.contentType);
    if (!isAllowedContentType(params.contentType)) {
      throw new BadRequestException('Unsupported contentType');
    }

    const date = new Date();
    const yyyy = String(date.getUTCFullYear());
    const mm = String(date.getUTCMonth() + 1).padStart(2, '0');

    const rand = crypto.randomBytes(16).toString('hex');
    const uid = params.userId ? sanitizePathPart(params.userId) : 'anon';
    const key = `${params.folder}/${yyyy}/${mm}/${uid}/${rand}${ext ? `.${ext}` : ''}`;

    const cmd = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: params.contentType,
    });

    const uploadUrl = await getSignedUrl(this.client, cmd, { expiresIn: 60 * 5 });
    const publicUrl = joinUrl(this.publicBaseUrl, key);

    return { key, uploadUrl, publicUrl, expiresInSeconds: 60 * 5 };
  }
}

function redactEndpoint(endpoint: string) {
  try {
    const u = new URL(endpoint);
    return `${u.protocol}//${u.host}`;
  } catch {
    return endpoint;
  }
}

function sanitizePathPart(input: string) {
  return input.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 80);
}

function sanitizeFileName(input: string) {
  // keep it short and safe (avoid path traversal)
  const base = input.split(/[\\/]/).pop() ?? 'file';
  return base.replace(/[^\w.\- ]/g, '').trim().slice(0, 255) || 'file';
}

function guessExtFromNameOrType(fileName: string, contentType: string) {
  const m = fileName.toLowerCase().match(/\.([a-z0-9]{1,8})$/);
  if (m?.[1]) return m[1];
  const map: Record<string, string> = {
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

function isAllowedContentType(ct: string) {
  const t = ct.toLowerCase();
  return (
    t === 'image/jpeg' ||
    t === 'image/png' ||
    t === 'image/webp' ||
    t === 'image/gif' ||
    t === 'video/mp4' ||
    t === 'video/webm' ||
    t === 'video/quicktime'
  );
}

function joinUrl(base: string, path: string) {
  return `${base.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
}

