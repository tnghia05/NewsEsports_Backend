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
const product_variant_model_1 = require("../models/product-variant.model");
let ProductsService = class ProductsService {
    productModel;
    variantModel;
    constructor(productModel, variantModel) {
        this.productModel = productModel;
        this.variantModel = variantModel;
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
                type: dto.type ?? 'physical',
                price: dto.price,
                stock: dto.stock,
                status,
                tags: (dto.tags ?? [])
                    .map((x) => x.trim().toLowerCase())
                    .filter(Boolean),
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
        if (dto.type !== undefined)
            patch.type = dto.type;
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
        const variants = await this.variantModel
            .find({ productId: product._id, status: 'active' })
            .sort({ createdAt: 1 })
            .exec();
        return { ...product.toObject(), variants };
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
            this.productModel
                .find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .exec(),
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
            this.productModel
                .find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .exec(),
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
    async listVariantsPublic(productId) {
        const product = await this.requireProduct(productId);
        if (product.status !== 'active')
            throw new common_1.NotFoundException('Product not found');
        return this.variantModel
            .find({ productId: product._id, status: 'active' })
            .sort({ createdAt: 1 })
            .exec();
    }
    async listVariantsAdmin(admin, productId) {
        if (admin.role !== 'admin')
            throw new common_1.ForbiddenException('Forbidden');
        const product = await this.requireProduct(productId);
        return this.variantModel
            .find({ productId: product._id })
            .sort({ createdAt: 1 })
            .exec();
    }
    async createVariant(admin, productId, dto) {
        if (admin.role !== 'admin')
            throw new common_1.ForbiddenException('Forbidden');
        const product = await this.requireProduct(productId);
        try {
            return await this.variantModel.create({
                productId: product._id,
                title: dto.title.trim(),
                skuCode: dto.skuCode.trim(),
                options: (dto.options ?? []).map((o) => ({ k: o.k.trim(), v: o.v.trim() })),
                price: dto.price,
                stock: dto.stock,
                status: dto.status ?? 'active',
            });
        }
        catch (e) {
            const msg = String(e?.message ?? e);
            if (msg.toLowerCase().includes('duplicate key') && msg.includes('skuCode')) {
                throw new common_1.BadRequestException('Variant skuCode already exists');
            }
            throw e;
        }
    }
    async updateVariant(admin, variantId, dto) {
        if (admin.role !== 'admin')
            throw new common_1.ForbiddenException('Forbidden');
        const variant = await this.variantModel.findById(variantId).exec();
        if (!variant)
            throw new common_1.NotFoundException('Variant not found');
        const patch = {};
        if (dto.title !== undefined)
            patch.title = dto.title.trim();
        if (dto.skuCode !== undefined)
            patch.skuCode = dto.skuCode.trim();
        if (dto.options !== undefined)
            patch.options = dto.options.map((o) => ({ k: o.k.trim(), v: o.v.trim() }));
        if (dto.price !== undefined)
            patch.price = dto.price;
        if (dto.stock !== undefined)
            patch.stock = dto.stock;
        if (dto.status !== undefined)
            patch.status = dto.status;
        try {
            const updated = await this.variantModel
                .findByIdAndUpdate(variant._id, { $set: patch }, { returnDocument: 'after' })
                .exec();
            if (!updated)
                throw new common_1.NotFoundException('Variant not found');
            return updated;
        }
        catch (e) {
            const msg = String(e?.message ?? e);
            if (msg.toLowerCase().includes('duplicate key') && msg.includes('skuCode')) {
                throw new common_1.BadRequestException('Variant skuCode already exists');
            }
            throw e;
        }
    }
    async removeVariant(admin, variantId) {
        if (admin.role !== 'admin')
            throw new common_1.ForbiddenException('Forbidden');
        const variant = await this.variantModel.findById(variantId).exec();
        if (!variant)
            throw new common_1.NotFoundException('Variant not found');
        await this.variantModel.deleteOne({ _id: variant._id }).exec();
        return { ok: true };
    }
};
exports.ProductsService = ProductsService;
exports.ProductsService = ProductsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(product_model_1.ProductModelName)),
    __param(1, (0, mongoose_1.InjectModel)(product_variant_model_1.ProductVariantModelName)),
    __metadata("design:paramtypes", [Function, Function])
], ProductsService);
function escapeRegex(input) {
    return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
//# sourceMappingURL=products.service.js.map