import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Types, type Model, type PipelineStage } from 'mongoose';
import {
  OrderCounterModelName,
  type OrderCounterDocument,
} from '../models/order-counter.model';
import { OrderModelName, type OrderDocument } from '../models/order.model';
import {
  ProductModelName,
  type ProductDocument,
} from '../models/product.model';
import {
  ProductVariantModelName,
  type ProductVariantDocument,
} from '../models/product-variant.model';
import type { JwtUser } from '../types/auth';
import type { CreateOrderDto } from '../dto/shop/orders/create-order.dto';
import type { QueryOrdersDto } from '../dto/shop/orders/query-orders.dto';

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(OrderModelName)
    private readonly orderModel: Model<OrderDocument>,
    @InjectModel(ProductModelName)
    private readonly productModel: Model<ProductDocument>,
    @InjectModel(ProductVariantModelName)
    private readonly variantModel: Model<ProductVariantDocument>,
    @InjectModel(OrderCounterModelName)
    private readonly orderCounterModel: Model<OrderCounterDocument>,
  ) {}

  async create(user: JwtUser, dto: CreateOrderDto) {
    if (!dto.items?.length) throw new BadRequestException('items is required');

    const normalized = dto.items.map((it) => ({
      productId: it.productId,
      variantId: it.variantId,
      qty: it.qty,
    }));

    // Fetch products
    const uniqueProductIds = Array.from(new Set(normalized.map((x) => x.productId)));
    const products = await this.productModel.find({ _id: { $in: uniqueProductIds }, status: 'active' }).exec();
    if (products.length !== uniqueProductIds.length) throw new BadRequestException('Some products are missing or inactive');
    const productById = new Map<string, ProductDocument>();
    for (const p of products) productById.set(String(p._id), p);

    // Fetch variants (if any)
    const variantIds = normalized.map((x) => x.variantId).filter(Boolean) as string[];
    const uniqueVariantIds = Array.from(new Set(variantIds));
    const variants = uniqueVariantIds.length
      ? await this.variantModel.find({ _id: { $in: uniqueVariantIds }, status: 'active' }).exec()
      : [];
    if (variants.length !== uniqueVariantIds.length) throw new BadRequestException('Some variants are missing or inactive');
    const variantById = new Map<string, ProductVariantDocument>();
    for (const v of variants) variantById.set(String(v._id), v);

    const items = normalized.map((it) => {
      const p = productById.get(it.productId);
      if (!p) throw new BadRequestException('Invalid product');
      if (it.variantId) {
        const v = variantById.get(it.variantId);
        if (!v) throw new BadRequestException('Invalid variant');
        if (String(v.productId) !== String(p._id)) throw new BadRequestException('Variant does not belong to product');
        const lineTotal = v.price * it.qty;
        return {
          productId: p._id,
          name: p.name,
          slug: p.slug,
          unitPrice: v.price,
          qty: it.qty,
          lineTotal,
          // keep extra fields in doc without breaking existing schema usage
          variantId: v._id,
          variantTitle: v.title,
          skuCode: v.skuCode,
          variantOptions: v.options,
        } as any;
      }
      const lineTotal = p.price * it.qty;
      return {
        productId: p._id,
        name: p.name,
        slug: p.slug,
        unitPrice: p.price,
        qty: it.qty,
        lineTotal,
      };
    });

    // Reserve TTL: hold stock for 15 minutes (no permanent stock decrement here)
    const reservedUntil = new Date(Date.now() + 15 * 60 * 1000);

    // Best-effort reservation. If any item fails, rollback previous reservations.
    for (let i = 0; i < items.length; i++) {
      const it: any = items[i];
      const updated = it.variantId
        ? await this.variantModel
            .updateOne(
              {
                _id: it.variantId,
                $expr: { $gte: [{ $subtract: ['$stock', '$reserved'] }, it.qty] },
              },
              { $inc: { reserved: it.qty } },
            )
            .exec()
        : await this.productModel
            .updateOne(
              {
                _id: it.productId,
                $expr: { $gte: [{ $subtract: ['$stock', '$reserved'] }, it.qty] },
              },
              { $inc: { reserved: it.qty } },
            )
            .exec();

      if (updated.modifiedCount !== 1) {
        // rollback previous reservations
        for (let j = 0; j < i; j++) {
          const prev: any = items[j];
          if (prev.variantId) {
            await this.variantModel
              .updateOne({ _id: prev.variantId }, { $inc: { reserved: -prev.qty } })
              .exec();
          } else {
            await this.productModel
              .updateOne({ _id: prev.productId }, { $inc: { reserved: -prev.qty } })
              .exec();
          }
        }
        throw new BadRequestException(`Out of stock: ${it.slug}`);
      }
    }

    const subtotal = items.reduce((sum, it) => sum + it.lineTotal, 0);
    const shippingFee = 0;
    const total = subtotal + shippingFee;
    const orderCode = await this.nextOrderCode();
    const userObjectId = Types.ObjectId.isValid(user.id)
      ? new Types.ObjectId(user.id)
      : user.id;

    return this.orderModel.create({
      userId: userObjectId,
      orderCode,
      items,
      receiverName: dto.receiverName?.trim(),
      receiverPhone: dto.phone?.trim(),
      receiverEmail: dto.email?.trim(),
      shippingAddress: dto.shippingAddress?.trim(),
      shippingMethod: dto.shippingMethod?.trim(),
      reservedUntil,
      subtotal,
      shippingFee,
      total,
      status: 'pending_payment',
      payment: {
        provider: 'vnpay',
        providerTxnRef: orderCode,
      },
    });
  }

  async getAdmin(admin: JwtUser, orderRef: string) {
    if (admin.role !== 'admin') throw new ForbiddenException('Forbidden');
    const order = Types.ObjectId.isValid(orderRef)
      ? await this.orderModel.findById(orderRef).exec()
      : await this.orderModel.findOne({ orderCode: orderRef }).exec();
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async listAdmin(admin: JwtUser, query: QueryOrdersDto) {
    if (admin.role !== 'admin') throw new ForbiddenException('Forbidden');

    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 50);
    const skip = (page - 1) * limit;

    const match: Record<string, any> = {};
    if (query.status) match.status = query.status;

    const pipeline: PipelineStage[] = [
      { $match: match },
      { $sort: { createdAt: -1 } },
      {
        $facet: {
          items: [{ $skip: skip }, { $limit: limit }],
          total: [{ $count: 'count' }],
        },
      },
    ];

    const res = await this.orderModel.aggregate(pipeline).exec();
    const items = (res?.[0]?.items ?? []) as OrderDocument[];
    const total = Number(res?.[0]?.total?.[0]?.count ?? 0);

    return {
      items,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async adminUpdateStatus(
    admin: JwtUser,
    orderRef: string,
    input: { status: any; trackingCode?: string },
  ) {
    if (admin.role !== 'admin') throw new ForbiddenException('Forbidden');

    const order = Types.ObjectId.isValid(orderRef)
      ? await this.orderModel.findById(orderRef).exec()
      : await this.orderModel.findOne({ orderCode: orderRef }).exec();
    if (!order) throw new NotFoundException('Order not found');

    assertAllowedTransition(order.status as any, input.status);

    const patch: Record<string, any> = { status: input.status };
    if (input.trackingCode !== undefined)
      patch.trackingCode = input.trackingCode?.trim();

    const updated = await this.orderModel
      .findByIdAndUpdate(order._id, { $set: patch }, { returnDocument: 'after' })
      .exec();
    if (!updated) throw new NotFoundException('Order not found');
    return updated;
  }

  async getMine(user: JwtUser, orderId: string) {
    const order = Types.ObjectId.isValid(orderId)
      ? await this.orderModel.findById(orderId).exec()
      : await this.orderModel.findOne({ orderCode: orderId }).exec();
    if (!order) throw new NotFoundException('Order not found');
    if (String(order.userId) !== user.id)
      throw new ForbiddenException('Forbidden');
    return order;
  }

  async listMine(user: JwtUser, query: QueryOrdersDto) {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 50);
    const skip = (page - 1) * limit;

    const userId = Types.ObjectId.isValid(user.id)
      ? new Types.ObjectId(user.id)
      : user.id;

    const match: Record<string, any> = { userId };
    if (query.status) match.status = query.status;

    const pipeline: PipelineStage[] = [
      { $match: match },
      { $sort: { createdAt: -1 } },
      {
        $facet: {
          items: [{ $skip: skip }, { $limit: limit }],
          total: [{ $count: 'count' }],
        },
      },
    ];

    const res = await this.orderModel.aggregate(pipeline).exec();
    const items = (res?.[0]?.items ?? []) as OrderDocument[];
    const total = Number(res?.[0]?.total?.[0]?.count ?? 0);

    return {
      items,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  private async nextOrderCode() {
    const day = formatDayKey(new Date()); // YYYYMMDD
    const key = `order:${day}`;

    const counter = await this.orderCounterModel
      .findOneAndUpdate(
        { key },
        { $inc: { seq: 1 } },
        { upsert: true, returnDocument: 'after' },
      )
      .exec();
    if (!counter) throw new Error('Failed to allocate order counter');

    const seqStr = String(counter.seq).padStart(6, '0');
    return `OD${day}-${seqStr}`;
  }
}

function assertAllowedTransition(from: string, to: string) {
  if (from === to) return;

  const allowed: Record<string, string[]> = {
    pending_payment: ['paid', 'cancelled', 'cancelled_expired'],
    paid: ['processing', 'cancelled', 'refunded'],
    processing: ['shipped', 'cancelled', 'refunded'],
    shipped: ['delivered', 'refunded'],
    delivered: ['refunded'],
    cancelled: [],
    cancelled_expired: [],
    refunded: [],
  };

  const next = allowed[from] ?? [];
  if (!next.includes(to)) {
    throw new BadRequestException(`Invalid status transition: ${from} -> ${to}`);
  }
}

function formatDayKey(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}${m}${day}`;
}
