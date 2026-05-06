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
exports.CrawlSourcesService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const crawl_source_model_1 = require("../models/crawl-source.model");
let CrawlSourcesService = class CrawlSourcesService {
    crawlSourceModel;
    constructor(crawlSourceModel) {
        this.crawlSourceModel = crawlSourceModel;
    }
    async listAdmin(admin) {
        if (admin.role !== 'admin')
            throw new common_1.ForbiddenException('Forbidden');
        return this.crawlSourceModel.find({}).sort({ createdAt: -1 }).exec();
    }
    async create(admin, dto) {
        if (admin.role !== 'admin')
            throw new common_1.ForbiddenException('Forbidden');
        const url = normalizeUrl(dto.url);
        try {
            return await this.crawlSourceModel.create({
                url,
                name: dto.name?.trim(),
                enabled: true,
                createdBy: admin.id,
            });
        }
        catch (e) {
            const msg = String(e?.message ?? e).toLowerCase();
            if (msg.includes('duplicate key'))
                throw new common_1.BadRequestException('Crawl source already exists');
            throw e;
        }
    }
    async update(admin, id, dto) {
        if (admin.role !== 'admin')
            throw new common_1.ForbiddenException('Forbidden');
        const src = await this.requireSource(id);
        const patch = {};
        if (dto.enabled !== undefined)
            patch.enabled = dto.enabled;
        if (dto.name !== undefined)
            patch.name = dto.name?.trim();
        const updated = await this.crawlSourceModel
            .findByIdAndUpdate(src._id, { $set: patch }, { returnDocument: 'after' })
            .exec();
        if (!updated)
            throw new common_1.NotFoundException('Crawl source not found');
        return updated;
    }
    async remove(admin, id) {
        if (admin.role !== 'admin')
            throw new common_1.ForbiddenException('Forbidden');
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
        return rows.map((r) => String(r.url));
    }
    async markCrawlResult(url, patch) {
        await this.crawlSourceModel
            .updateOne({ url }, {
            $set: {
                lastCrawledAt: patch.ok ? new Date() : undefined,
                lastError: patch.ok ? undefined : patch.error,
            },
        })
            .exec();
    }
    async requireSource(id) {
        const src = await this.crawlSourceModel.findById(id).exec();
        if (!src)
            throw new common_1.NotFoundException('Crawl source not found');
        return src;
    }
};
exports.CrawlSourcesService = CrawlSourcesService;
exports.CrawlSourcesService = CrawlSourcesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(crawl_source_model_1.CrawlSourceModelName)),
    __metadata("design:paramtypes", [Function])
], CrawlSourcesService);
function normalizeUrl(url) {
    try {
        const u = new URL(url.trim());
        u.hash = '';
        return u.toString();
    }
    catch {
        throw new common_1.BadRequestException('Invalid URL');
    }
}
//# sourceMappingURL=crawl-sources.service.js.map