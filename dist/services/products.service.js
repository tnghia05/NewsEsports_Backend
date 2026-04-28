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
exports.ProductsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const product_model_1 = require("../models/product.model");
let ProductsService = class ProductsService {
    productModel;
    constructor(productModel) {
        this.productModel = productModel;
    }
    async create(admin, dto) {
        if (admin.role !== 'admin')
            throw new common_1.ForbiddenException('Forbidden');
        const status = dto.status ?? 'active';
        try {
            return await this.productModel.create({
                name: dto.name.trim(),
                slug: dto.slug.trim().toLowerCase(),
                description: dto.description?.trim(),
                imageUrls: dto.imageUrls?.map((x) => x.trim()).filter(Boolean) ?? [],
                price: dto.price,
                stock: dto.stock,
                status,
                tags: (dto.tags ?? []).map((x) => x.trim().toLowerCase()).filter(Boolean),
            });
        }
        catch (e) {
            const msg = String(e?.message ?? e);
            if (msg.toLowerCase().includes('duplicate key') && msg.includes('slug')) {
                throw new common_1.BadRequestException('Product slug already exists');
            }
            throw e;
        }
    }
    async update(admin, id, dto) {
        if (admin.role !== 'admin')
            throw new common_1.ForbiddenException('Forbidden');
        const product = await this.requireProduct(id);
        const patch = {};
        if (dto.name !== undefined)
            patch.name = dto.name.trim();
        if (dto.slug !== undefined)
            patch.slug = dto.slug.trim().toLowerCase();
        if (dto.description !== undefined)
            patch.description = dto.description?.trim();
        if (dto.imageUrls !== undefined)
            patch.imageUrls = dto.imageUrls.map((x) => x.trim()).filter(Boolean);
        if (dto.price !== undefined)
            patch.price = dto.price;
        if (dto.stock !== undefined)
            patch.stock = dto.stock;
        if (dto.status !== undefined)
            patch.status = dto.status;
        if (dto.tags !== undefined)
            patch.tags = dto.tags.map((x) => x.trim().toLowerCase()).filter(Boolean);
        try {
            const updated = await this.productModel
                .findByIdAndUpdate(product._id, { $set: patch }, { returnDocument: 'after' })
                .exec();
            if (!updated)
                throw new common_1.NotFoundException('Product not found');
            return updated;
        }
        catch (e) {
            const msg = String(e?.message ?? e);
            if (msg.toLowerCase().includes('duplicate key') && msg.includes('slug')) {
                throw new common_1.BadRequestException('Product slug already exists');
            }
            throw e;
        }
    }
    async remove(admin, id) {
        if (admin.role !== 'admin')
            throw new common_1.ForbiddenException('Forbidden');
        const product = await this.requireProduct(id);
        await this.productModel.deleteOne({ _id: product._id }).exec();
        return { ok: true };
    }
    async getById(id) {
        const product = await this.productModel.findById(id).exec();
        if (!product)
            throw new common_1.NotFoundException('Product not found');
        return product;
    }
    async listPublic(query) {
        const page = query.page ?? 1;
        const limit = Math.min(query.limit ?? 20, 50);
        const skip = (page - 1) * limit;
        const filter = { status: 'active' };
        if (query.q)
            filter.name = { $regex: escapeRegex(query.q.trim()), $options: 'i' };
        if (query.tag)
            filter.tags = query.tag.trim().toLowerCase();
        const [items, total] = await Promise.all([
            this.productModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
            this.productModel.countDocuments(filter).exec(),
        ]);
        return {
            items,
            meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
        };
    }
    async listAdmin(admin, query) {
        if (admin.role !== 'admin')
            throw new common_1.ForbiddenException('Forbidden');
        const page = query.page ?? 1;
        const limit = Math.min(query.limit ?? 20, 50);
        const skip = (page - 1) * limit;
        const filter = {};
        if (query.status)
            filter.status = query.status;
        if (query.q)
            filter.name = { $regex: escapeRegex(query.q.trim()), $options: 'i' };
        if (query.tag)
            filter.tags = query.tag.trim().toLowerCase();
        const [items, total] = await Promise.all([
            this.productModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
            this.productModel.countDocuments(filter).exec(),
        ]);
        return {
            items,
            meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
        };
    }
    async requireProduct(id) {
        const product = await this.productModel.findById(id).exec();
        if (!product)
            throw new common_1.NotFoundException('Product not found');
        return product;
    }
};
exports.ProductsService = ProductsService;
exports.ProductsService = ProductsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(product_model_1.ProductModelName)),
    __metadata("design:paramtypes", [Function])
], ProductsService);
function escapeRegex(input) {
    return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
//# sourceMappingURL=products.service.js.map