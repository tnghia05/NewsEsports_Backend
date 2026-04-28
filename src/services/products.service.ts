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
import type { CreateProductDto } from '../dto/shop/products/create-product.dto';
import type { UpdateProductDto } from '../dto/shop/products/update-product.dto';
import type { QueryProductsDto } from '../dto/shop/products/query-products.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(ProductModelName)
    private readonly productModel: Model<ProductDocument>,
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
    return product;
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
}

function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
