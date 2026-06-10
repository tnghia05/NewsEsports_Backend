import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model, QueryFilter } from 'mongoose';
import type { JwtUser } from '../types/auth';
import {
  ProductModelName,
  type ProductDocument,
  type ProductStatus,
} from '../models/product.model';
import {
  ProductVariantModelName,
  type ProductVariantDocument,
} from '../models/product-variant.model';
import type { CreateProductDto } from '../dto/shop/products/create-product.dto';
import type { UpdateProductDto } from '../dto/shop/products/update-product.dto';
import type { QueryProductsDto } from '../dto/shop/products/query-products.dto';
import type { CreateProductVariantDto } from '../dto/shop/products/variants/create-product-variant.dto';
import type { UpdateProductVariantDto } from '../dto/shop/products/variants/update-product-variant.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(ProductModelName)
    private readonly productModel: Model<ProductDocument>,
    @InjectModel(ProductVariantModelName)
    private readonly variantModel: Model<ProductVariantDocument>,
  ) {}

  async create(admin: JwtUser, dto: CreateProductDto) {
    if (admin.role !== 'admin') throw new ForbiddenException('Forbidden');

    const status: ProductStatus = dto.status ?? 'active';
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
    } catch (e: any) {
      const msg = String(e?.message ?? e);
      if (msg.toLowerCase().includes('duplicate key') && msg.includes('slug')) {
        throw new BadRequestException('Product slug already exists');
      }
      throw e;
    }
  }

  async update(admin: JwtUser, id: string, dto: UpdateProductDto) {
    if (admin.role !== 'admin') throw new ForbiddenException('Forbidden');

    const product = await this.requireProduct(id);
    const patch: Partial<ProductDocument> = {};

    if (dto.name !== undefined) patch.name = dto.name.trim();
    if (dto.slug !== undefined) patch.slug = dto.slug.trim().toLowerCase();
    if (dto.description !== undefined)
      patch.description = dto.description?.trim();
    if (dto.imageUrls !== undefined)
      patch.imageUrls = dto.imageUrls.map((x) => x.trim()).filter(Boolean);
    if (dto.type !== undefined) patch.type = dto.type;
    if (dto.price !== undefined) patch.price = dto.price;
    if (dto.stock !== undefined) patch.stock = dto.stock;
    if (dto.status !== undefined) patch.status = dto.status;
    if (dto.tags !== undefined)
      patch.tags = dto.tags.map((x) => x.trim().toLowerCase()).filter(Boolean);

    try {
      const updated = await this.productModel
        .findByIdAndUpdate(
          product._id,
          { $set: patch },
          { returnDocument: 'after' },
        )
        .exec();
      if (!updated) throw new NotFoundException('Product not found');
      return updated;
    } catch (e: any) {
      const msg = String(e?.message ?? e);
      if (msg.toLowerCase().includes('duplicate key') && msg.includes('slug')) {
        throw new BadRequestException('Product slug already exists');
      }
      throw e;
    }
  }

  async remove(admin: JwtUser, id: string) {
    if (admin.role !== 'admin') throw new ForbiddenException('Forbidden');
    const product = await this.requireProduct(id);
    await this.productModel.deleteOne({ _id: product._id }).exec();
    return { ok: true };
  }

  async getById(id: string) {
    const product = await this.productModel.findById(id).exec();
    if (!product) throw new NotFoundException('Product not found');
    const variants = await this.variantModel
      .find({ productId: product._id, status: 'active' })
      .sort({ createdAt: 1 })
      .exec();
    return { ...product.toObject(), variants };
  }

  async listPublic(query: QueryProductsDto) {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 50);
    const skip = (page - 1) * limit;

    const filter: QueryFilter<ProductDocument> = { status: 'active' };
    if (query.q)
      filter.name = { $regex: escapeRegex(query.q.trim()), $options: 'i' };
    if (query.tag) filter.tags = query.tag.trim().toLowerCase();

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

  async listAdmin(admin: JwtUser, query: QueryProductsDto) {
    if (admin.role !== 'admin') throw new ForbiddenException('Forbidden');

    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 50);
    const skip = (page - 1) * limit;

    const filter: QueryFilter<ProductDocument> = {};
    if (query.status) filter.status = query.status;
    if (query.q)
      filter.name = { $regex: escapeRegex(query.q.trim()), $options: 'i' };
    if (query.tag) filter.tags = query.tag.trim().toLowerCase();

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

  async requireProduct(id: string) {
    const product = await this.productModel.findById(id).exec();
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async listVariantsPublic(productId: string) {
    const product = await this.requireProduct(productId);
    if (product.status !== 'active')
      throw new NotFoundException('Product not found');
    return this.variantModel
      .find({ productId: product._id, status: 'active' })
      .sort({ createdAt: 1 })
      .exec();
  }

  async listVariantsAdmin(admin: JwtUser, productId: string) {
    if (admin.role !== 'admin') throw new ForbiddenException('Forbidden');
    const product = await this.requireProduct(productId);
    return this.variantModel
      .find({ productId: product._id })
      .sort({ createdAt: 1 })
      .exec();
  }

  async createVariant(
    admin: JwtUser,
    productId: string,
    dto: CreateProductVariantDto,
  ) {
    if (admin.role !== 'admin') throw new ForbiddenException('Forbidden');
    const product = await this.requireProduct(productId);
    try {
      return await this.variantModel.create({
        productId: product._id,
        title: dto.title.trim(),
        skuCode: dto.skuCode.trim(),
        options: (dto.options ?? []).map((o) => ({
          k: o.k.trim(),
          v: o.v.trim(),
        })),
        price: dto.price,
        stock: dto.stock,
        status: dto.status ?? 'active',
      });
    } catch (e: any) {
      const msg = String(e?.message ?? e);
      if (
        msg.toLowerCase().includes('duplicate key') &&
        msg.includes('skuCode')
      ) {
        throw new BadRequestException('Variant skuCode already exists');
      }
      throw e;
    }
  }

  async updateVariant(
    admin: JwtUser,
    variantId: string,
    dto: UpdateProductVariantDto,
  ) {
    if (admin.role !== 'admin') throw new ForbiddenException('Forbidden');
    const variant = await this.variantModel.findById(variantId).exec();
    if (!variant) throw new NotFoundException('Variant not found');

    const patch: Partial<ProductVariantDocument> = {};
    if (dto.title !== undefined) patch.title = dto.title.trim();
    if (dto.skuCode !== undefined) patch.skuCode = dto.skuCode.trim();
    if (dto.options !== undefined)
      patch.options = dto.options.map((o) => ({
        k: o.k.trim(),
        v: o.v.trim(),
      }));
    if (dto.price !== undefined) patch.price = dto.price;
    if (dto.stock !== undefined) patch.stock = dto.stock;
    if (dto.status !== undefined) patch.status = dto.status;

    try {
      const updated = await this.variantModel
        .findByIdAndUpdate(
          variant._id,
          { $set: patch },
          { returnDocument: 'after' },
        )
        .exec();
      if (!updated) throw new NotFoundException('Variant not found');
      return updated;
    } catch (e: any) {
      const msg = String(e?.message ?? e);
      if (
        msg.toLowerCase().includes('duplicate key') &&
        msg.includes('skuCode')
      ) {
        throw new BadRequestException('Variant skuCode already exists');
      }
      throw e;
    }
  }

  async removeVariant(admin: JwtUser, variantId: string) {
    if (admin.role !== 'admin') throw new ForbiddenException('Forbidden');
    const variant = await this.variantModel.findById(variantId).exec();
    if (!variant) throw new NotFoundException('Variant not found');
    await this.variantModel.deleteOne({ _id: variant._id }).exec();
    return { ok: true };
  }
}

function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
