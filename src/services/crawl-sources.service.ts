import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import type { CreateCrawlSourceDto } from '../dto/crawl/create-crawl-source.dto';
import type { UpdateCrawlSourceDto } from '../dto/crawl/update-crawl-source.dto';
import {
  CrawlSourceModelName,
  type CrawlSourceDocument,
} from '../models/crawl-source.model';
import type { JwtUser } from '../types/auth';

@Injectable()
export class CrawlSourcesService {
  constructor(
    @InjectModel(CrawlSourceModelName)
    private readonly crawlSourceModel: Model<CrawlSourceDocument>,
  ) {}

  async listAdmin(admin: JwtUser) {
    if (admin.role !== 'admin') throw new ForbiddenException('Forbidden');
    return this.crawlSourceModel.find({}).sort({ createdAt: -1 }).exec();
  }

  async create(admin: JwtUser, dto: CreateCrawlSourceDto) {
    if (admin.role !== 'admin') throw new ForbiddenException('Forbidden');
    const url = normalizeUrl(dto.url);
    try {
      return await this.crawlSourceModel.create({
        url,
        name: dto.name?.trim(),
        enabled: true,
        createdBy: admin.id,
      });
    } catch (e: any) {
      const msg = String(e?.message ?? e).toLowerCase();
      if (msg.includes('duplicate key'))
        throw new BadRequestException('Crawl source already exists');
      throw e;
    }
  }

  async update(admin: JwtUser, id: string, dto: UpdateCrawlSourceDto) {
    if (admin.role !== 'admin') throw new ForbiddenException('Forbidden');
    const src = await this.requireSource(id);
    const patch: Partial<CrawlSourceDocument> = {};
    if (dto.enabled !== undefined) patch.enabled = dto.enabled;
    if (dto.name !== undefined) patch.name = dto.name?.trim();
    const updated = await this.crawlSourceModel
      .findByIdAndUpdate(src._id, { $set: patch }, { returnDocument: 'after' })
      .exec();
    if (!updated) throw new NotFoundException('Crawl source not found');
    return updated;
  }

  async remove(admin: JwtUser, id: string) {
    if (admin.role !== 'admin') throw new ForbiddenException('Forbidden');
    const src = await this.requireSource(id);
    await src.deleteOne();
    return { ok: true };
  }

  async listEnabledUrls() {
    const rows = await this.crawlSourceModel
      .find({ enabled: true })
      .select({ url: 1 })
      .lean()
      .exec();
    return rows.map((r: any) => String(r.url));
  }

  async markCrawlResult(url: string, patch: { ok: boolean; error?: string }) {
    await this.crawlSourceModel
      .updateOne(
        { url },
        {
          $set: {
            lastCrawledAt: patch.ok ? new Date() : undefined,
            lastError: patch.ok ? undefined : patch.error,
          },
        },
      )
      .exec();
  }

  private async requireSource(id: string) {
    const src = await this.crawlSourceModel.findById(id).exec();
    if (!src) throw new NotFoundException('Crawl source not found');
    return src;
  }
}

function normalizeUrl(url: string) {
  try {
    const u = new URL(url.trim());
    u.hash = '';
    return u.toString();
  } catch {
    throw new BadRequestException('Invalid URL');
  }
}
