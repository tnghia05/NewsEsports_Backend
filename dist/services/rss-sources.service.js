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
exports.RssSourcesService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const rss_source_model_1 = require("../models/rss-source.model");
let RssSourcesService = class RssSourcesService {
    rssSourceModel;
    constructor(rssSourceModel) {
        this.rssSourceModel = rssSourceModel;
    }
    async listAdmin(admin) {
        if (admin.role !== 'admin')
            throw new common_1.ForbiddenException('Forbidden');
        return this.rssSourceModel.find({}).sort({ createdAt: -1 }).exec();
    }
    async create(admin, dto) {
        if (admin.role !== 'admin')
            throw new common_1.ForbiddenException('Forbidden');
        const url = normalizeUrl(dto.url);
        try {
            return await this.rssSourceModel.create({
                url,
                name: dto.name?.trim(),
                enabled: true,
                createdBy: admin.id,
            });
        }
        catch (e) {
            const msg = String(e?.message ?? e).toLowerCase();
            if (msg.includes('duplicate key'))
                throw new common_1.BadRequestException('RSS source already exists');
            throw e;
        }
    }
    async update(admin, id, dto) {
        if (admin.role !== 'admin')
            throw new common_1.ForbiddenException('Forbidden');
        const source = await this.requireSource(id);
        const patch = {};
        if (dto.enabled !== undefined)
            patch.enabled = dto.enabled;
        if (dto.name !== undefined)
            patch.name = dto.name?.trim();
        const updated = await this.rssSourceModel
            .findByIdAndUpdate(source._id, { $set: patch }, { new: true })
            .exec();
        if (!updated)
            throw new common_1.NotFoundException('RSS source not found');
        return updated;
    }
    async remove(admin, id) {
        if (admin.role !== 'admin')
            throw new common_1.ForbiddenException('Forbidden');
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
        return rows.map((r) => String(r.url));
    }
    async markImportResult(url, patch) {
        await this.rssSourceModel
            .updateOne({ url }, {
            $set: {
                lastImportedAt: patch.ok ? new Date() : undefined,
                lastError: patch.ok ? undefined : patch.error,
            },
        })
            .exec();
    }
    async requireSource(id) {
        const src = await this.rssSourceModel.findById(id).exec();
        if (!src)
            throw new common_1.NotFoundException('RSS source not found');
        return src;
    }
};
exports.RssSourcesService = RssSourcesService;
exports.RssSourcesService = RssSourcesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(rss_source_model_1.RssSourceModelName)),
    __metadata("design:paramtypes", [Function])
], RssSourcesService);
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
//# sourceMappingURL=rss-sources.service.js.map