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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NewsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const news_model_1 = require("../models/news.model");
let NewsService = class NewsService {
    newsModel;
    constructor(newsModel) {
        this.newsModel = newsModel;
    }
    async create(admin, dto) {
        if (admin.role !== 'admin')
            throw new common_1.ForbiddenException('Forbidden');
        const title = dto.title.trim();
        const slug = normalizeSlug(dto.slug ?? slugify(title));
        const status = dto.status ?? 'draft';
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
        }
        catch (e) {
            const msg = String(e?.message ?? e);
            if (msg.toLowerCase().includes('duplicate key') && msg.includes('slug')) {
                throw new common_1.BadRequestException('Slug already exists');
            }
            throw e;
        }
    }
    async update(admin, id, dto) {
        if (admin.role !== 'admin')
            throw new common_1.ForbiddenException('Forbidden');
        const news = await this.requireNews(id);
        const patch = {};
        if (dto.title !== undefined)
            patch.title = dto.title.trim();
        if (dto.slug !== undefined)
            patch.slug = normalizeSlug(dto.slug);
        if (dto.excerpt !== undefined)
            patch.excerpt = dto.excerpt?.trim();
        if (dto.content !== undefined)
            patch.content = dto.content;
        if (dto.coverImageUrl !== undefined)
            patch.coverImageUrl = dto.coverImageUrl?.trim();
        if (dto.tags !== undefined)
            patch.tags = normalizeTags(dto.tags);
        if (dto.status !== undefined) {
            patch.status = dto.status;
            if (dto.status === 'published') {
                patch.publishedAt = news.publishedAt ?? new Date();
            }
            else {
                patch.publishedAt = undefined;
            }
        }
        try {
            const updated = await this.newsModel
                .findByIdAndUpdate(news._id, { $set: patch }, { returnDocument: 'after' })
                .exec();
            if (!updated)
                throw new common_1.NotFoundException('News not found');
            return updated;
        }
        catch (e) {
            const msg = String(e?.message ?? e);
            if (msg.toLowerCase().includes('duplicate key') && msg.includes('slug')) {
                throw new common_1.BadRequestException('Slug already exists');
            }
            throw e;
        }
    }
    async remove(admin, id) {
        if (admin.role !== 'admin')
            throw new common_1.ForbiddenException('Forbidden');
        const news = await this.requireNews(id);
        await news.deleteOne();
        return { ok: true };
    }
    async removeMany(admin, ids) {
        if (admin.role !== 'admin')
            throw new common_1.ForbiddenException('Forbidden');
        const uniq = [...new Set(ids.map(id => id.trim()).filter(Boolean))];
        const oids = uniq
            .filter(id => mongoose_2.Types.ObjectId.isValid(id))
            .map(id => new mongoose_2.Types.ObjectId(id));
        if (!oids.length)
            throw new common_1.BadRequestException('No valid ids');
        const res = await this.newsModel.deleteMany({ _id: { $in: oids } }).exec();
        return { ok: true, deleted: res.deletedCount ?? 0 };
    }
    async getPublicBySlug(slug) {
        const s = normalizeSlug(slug);
        const news = await this.newsModel
            .findOne({ slug: s, status: 'published' })
            .exec();
        if (!news)
            throw new common_1.NotFoundException('News not found');
        return news;
    }
    async getPublicById(id) {
        const news = await this.newsModel.findById(id).exec();
        if (!news || news.status !== 'published')
            throw new common_1.NotFoundException('News not found');
        return news;
    }
    async listPublic(query) {
        const page = Math.max(1, Number(query.page) || 1);
        const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
        const skip = (page - 1) * limit;
        const filter = { status: 'published' };
        if (query.tag)
            filter['tags'] = { $in: [normalizeTag(query.tag)] };
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
    async listAdmin(admin, query) {
        if (admin.role !== 'admin')
            throw new common_1.ForbiddenException('Forbidden');
        const page = Math.max(1, Number(query.page) || 1);
        const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
        const skip = (page - 1) * limit;
        const filter = {};
        const status = query.status ?? 'all';
        if (status !== 'all')
            filter['status'] = status;
        if (query.tag)
            filter['tags'] = { $in: [normalizeTag(query.tag)] };
        if (query.q)
            filter['title'] = { $regex: escapeRegex(query.q.trim()), $options: 'i' };
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
    async requireNews(id) {
        const news = await this.newsModel.findById(id).exec();
        if (!news)
            throw new common_1.NotFoundException('News not found');
        return news;
    }
};
exports.NewsService = NewsService;
exports.NewsService = NewsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(news_model_1.NewsModelName)),
    __metadata("design:paramtypes", [Function])
], NewsService);
function normalizeTags(tags) {
    if (!tags)
        return [];
    const out = new Set();
    for (const t of tags) {
        const s = normalizeTag(t);
        if (!s)
            continue;
        out.add(s);
    }
    return [...out];
}
function normalizeTag(tag) {
    const s = tag.trim().toLowerCase();
    if (!s)
        return '';
    return s.startsWith('#') ? s.slice(1) : s;
}
function normalizeSlug(slug) {
    return slug
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9\-_.]/g, '')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
}
function slugify(title) {
    return normalizeSlug(title
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'd'));
}
function escapeRegex(input) {
    return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
//# sourceMappingURL=news.service.js.map