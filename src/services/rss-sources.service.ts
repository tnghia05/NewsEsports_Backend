import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import type { CreateRssSourceDto } from '../dto/rss/create-rss-source.dto';
import type { UpdateRssSourceDto } from '../dto/rss/update-rss-source.dto';
import { RssSourceModelName, type RssSourceDocument } from '../models/rss-source.model';
import type { JwtUser } from '../types/auth';

@Injectable()
export class RssSourcesService {
  constructor(
    @InjectModel(RssSourceModelName)
    private readonly rssSourceModel: Model<RssSourceDocument>,
  ) {}

  async listAdmin(admin: JwtUser) {
    if (admin.role !== 'admin') throw new ForbiddenException('Forbidden');
    return this.rssSourceModel.find({}).sort({ createdAt: -1 }).exec();
  }

  async create(admin: JwtUser, dto: CreateRssSourceDto) {
    if (admin.role !== 'admin') throw new ForbiddenException('Forbidden');
    const url = normalizeUrl(dto.url);
    try {
      return await this.rssSourceModel.create({
        url,
        name: dto.name?.trim(),
        enabled: true,
        createdBy: admin.id,
      });
    } catch (e: any) {
      const msg = String(e?.message ?? e).toLowerCase();
      if (msg.includes('duplicate key')) throw new BadRequestException('RSS source already exists');
      throw e;
    }
  }

  async update(admin: JwtUser, id: string, dto: UpdateRssSourceDto) {
    if (admin.role !== 'admin') throw new ForbiddenException('Forbidden');
    const source = await this.requireSource(id);
    const patch: Partial<RssSourceDocument> = {};
    if (dto.enabled !== undefined) patch.enabled = dto.enabled;
    if (dto.name !== undefined) patch.name = dto.name?.trim();
    const updated = await this.rssSourceModel
      .findByIdAndUpdate(source._id, { $set: patch }, { returnDocument: 'after' })
      .exec();
    if (!updated) throw new NotFoundException('RSS source not found');
    return updated;
  }

  async remove(admin: JwtUser, id: string) {
    if (admin.role !== 'admin') throw new ForbiddenException('Forbidden');
    const source = await this.requireSource(id);
    await source.deleteOne();
    return { ok: true };
  }

  async listEnabledUrls() {
    const rows = await this.rssSourceModel
      .find({ enabled: true })
      .select({ url: 1 })
      .lean()
      .exec();
    return rows.map((r: any) => String(r.url));
  }

  async markImportResult(url: string, patch: { ok: boolean; error?: string }) {
    await this.rssSourceModel
      .updateOne(
        { url },
        {
          $set: {
            lastImportedAt: patch.ok ? new Date() : undefined,
            lastError: patch.ok ? undefined : patch.error,
          },
        },
      )
      .exec();
  }

  private async requireSource(id: string) {
    const src = await this.rssSourceModel.findById(id).exec();
    if (!src) throw new NotFoundException('RSS source not found');
    return src;
  }
}

function normalizeUrl(url: string) {
  try {
    const u = new URL(url.trim());
    // strip hash
    u.hash = '';
    return u.toString();
  } catch {
    throw new BadRequestException('Invalid URL');
  }
}

