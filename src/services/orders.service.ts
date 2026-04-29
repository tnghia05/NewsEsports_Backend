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
    @InjectModel(OrderCounterModelName)
    private readonly orderCounterModel: Model<OrderCounterDocument>,
  ) {}

  async create(user: JwtUser, dto: CreateOrderDto) {
    if (!dto.items?.length) throw new BadRequestException('items is required');

    const normalized = dto.items.map((it) => ({
      productId: it.productId,
      qty: it.qty,
    }));

    const uniqueProductIds = Array.from(
      new Set(normalized.map((x) => x.productId)),
    );
    const products = await this.productModel
      .find({ _id: { $in: uniqueProductIds }, status: 'active' })
      .exec();

    if (products.length !== uniqueProductIds.length) {
      throw new BadRequestException('Some products are missing or inactive');
    }

    const byId = new Map<string, ProductDocument>();
    for (const p of products) byId.set(String(p._id), p);

    const items = normalized.map((it) => {
      const p = byId.get(it.productId);
      if (!p) throw new BadRequestException('Invalid product');
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

    // Best-effort stock reservation (no payment yet). Keep simple for milestone 7.
    for (const it of items) {
      const updated = await this.productModel
        .updateOne(
          { _id: it.productId, stock: { $gte: it.qty } },
          { $inc: { stock: -it.qty } },
        )
        .exec();
      if (updated.modifiedCount !== 1) {
        // rollback reserved stock for previous items
        for (const prev of items) {
          if (String(prev.productId) === String(it.productId)) break;
          await this.productModel
            .updateOne({ _id: prev.productId }, { $inc: { stock: prev.qty } })
            .exec();
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

function formatDayKey(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}${m}${day}`;
}
