import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model, QueryFilter } from 'mongoose';
import type { CreateNewsDto } from '../dto/news/create-news.dto';
import type { QueryNewsDto } from '../dto/news/query-news.dto';
import type { UpdateNewsDto } from '../dto/news/update-news.dto';
import {
  NewsModelName,
  type NewsDocument,
  type NewsStatus,
} from '../models/news.model';
import type { JwtUser } from '../types/auth';

@Injectable()
export class NewsService {
  constructor(@InjectModel(NewsModelName) private readonly newsModel: Model<NewsDocument>) {}

  async create(admin: JwtUser, dto: CreateNewsDto) {
    if (admin.role !== 'admin') throw new ForbiddenException('Forbidden');
    const title = dto.title.trim();
    const slug = normalizeSlug(dto.slug ?? slugify(title));

    const status: NewsStatus = dto.status ?? 'draft';
    const publishedAt = status === 'published' ? new Date() : undefined;

    try {
      return await this.newsModel.create({
        title,
        slug,
        excerpt: dto.excerpt?.trim(),
        content: dto.content,
        coverImageUrl: dto.coverImageUrl?.trim(),
        tags: normalizeTags(dto.tags),
        status,
        publishedAt,
        source: 'admin',
        authorId: admin.id,
      });
    } catch (e: any) {
      const msg = String(e?.message ?? e);
      if (msg.toLowerCase().includes('duplicate key') && msg.includes('slug')) {
        throw new BadRequestException('Slug already exists');
      }
      throw e;
    }
  }

  async update(admin: JwtUser, id: string, dto: UpdateNewsDto) {
    if (admin.role !== 'admin') throw new ForbiddenException('Forbidden');
    const news = await this.requireNews(id);

    const patch: Partial<NewsDocument> = {};
    if (dto.title !== undefined) patch.title = dto.title.trim();
    if (dto.slug !== undefined) patch.slug = normalizeSlug(dto.slug);
    if (dto.excerpt !== undefined) patch.excerpt = dto.excerpt?.trim();
    if (dto.content !== undefined) patch.content = dto.content;
    if (dto.coverImageUrl !== undefined) patch.coverImageUrl = dto.coverImageUrl?.trim();
    if (dto.tags !== undefined) patch.tags = normalizeTags(dto.tags);

    if (dto.status !== undefined) {
      patch.status = dto.status;
      if (dto.status === 'published') {
        patch.publishedAt = news.publishedAt ?? new Date();
      } else {
        patch.publishedAt = undefined;
      }
    }

    try {
      const updated = await this.newsModel
        .findByIdAndUpdate(news._id, { $set: patch }, { new: true })
        .exec();
      if (!updated) throw new NotFoundException('News not found');
      return updated;
    } catch (e: any) {
      const msg = String(e?.message ?? e);
      if (msg.toLowerCase().includes('duplicate key') && msg.includes('slug')) {
        throw new BadRequestException('Slug already exists');
      }
      throw e;
    }
  }

  async remove(admin: JwtUser, id: string) {
    if (admin.role !== 'admin') throw new ForbiddenException('Forbidden');
    const news = await this.requireNews(id);
    await news.deleteOne();
    return { ok: true };
  }

  async getPublicBySlug(slug: string) {
    const s = normalizeSlug(slug);
    const news = await this.newsModel
      .findOne({ slug: s, status: 'published' })
      .exec();
    if (!news) throw new NotFoundException('News not found');
    return news;
  }

  async getPublicById(id: string) {
    const news = await this.newsModel.findById(id).exec();
    if (!news || news.status !== 'published') throw new NotFoundException('News not found');
    return news;
  }

  async listPublic(query: QueryNewsDto) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const filter: QueryFilter<NewsDocument> = { status: 'published' };
    if (query.tag) filter['tags'] = { $in: [normalizeTag(query.tag)] };

    const [items, total] = await Promise.all([
      this.newsModel
        .find(filter)
        .sort({ publishedAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.newsModel.countDocuments(filter).exec(),
    ]);

    return { items, page, limit, total, hasMore: skip + items.length < total };
  }

  async listAdmin(admin: JwtUser, query: QueryNewsDto) {
    if (admin.role !== 'admin') throw new ForbiddenException('Forbidden');
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const filter: QueryFilter<NewsDocument> = {};
    const status = query.status ?? 'all';
    if (status !== 'all') filter['status'] = status;
    if (query.tag) filter['tags'] = { $in: [normalizeTag(query.tag)] };
    if (query.q) filter['title'] = { $regex: escapeRegex(query.q.trim()), $options: 'i' };

    const [items, total] = await Promise.all([
      this.newsModel
        .find(filter)
        .sort({ publishedAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.newsModel.countDocuments(filter).exec(),
    ]);

    return { items, page, limit, total, hasMore: skip + items.length < total };
  }

  private async requireNews(id: string) {
    const news = await this.newsModel.findById(id).exec();
    if (!news) throw new NotFoundException('News not found');
    return news;
  }
}

function normalizeTags(tags?: string[]) {
  if (!tags) return [];
  const out = new Set<string>();
  for (const t of tags) {
    const s = normalizeTag(t);
    if (!s) continue;
    out.add(s);
  }
  return [...out];
}

function normalizeTag(tag: string) {
  const s = tag.trim().toLowerCase();
  if (!s) return '';
  return s.startsWith('#') ? s.slice(1) : s;
}

function normalizeSlug(slug: string) {
  return slug
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9\-_.]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function slugify(title: string) {
  return normalizeSlug(
    title
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'd'),
  );
}

function escapeRegex(input: string) {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

