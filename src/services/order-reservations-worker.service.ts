import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { OrderModelName, type OrderDocument } from '../models/order.model';
import { ProductModelName, type ProductDocument } from '../models/product.model';
import {
  ProductVariantModelName,
  type ProductVariantDocument,
} from '../models/product-variant.model';

@Injectable()
export class OrderReservationsWorkerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OrderReservationsWorkerService.name);
  private timer?: NodeJS.Timeout;
  private isRunning = false;

  constructor(
    @InjectModel(OrderModelName) private readonly orderModel: Model<OrderDocument>,
    @InjectModel(ProductModelName)
    private readonly productModel: Model<ProductDocument>,
    @InjectModel(ProductVariantModelName)
    private readonly variantModel: Model<ProductVariantDocument>,
  ) {}

  onModuleInit() {
    // Every 60s: cancel expired pending orders and release reserved stock
    this.timer = setInterval(() => void this.tick(), 60_000);
    // Run once shortly after startup
    setTimeout(() => void this.tick(), 5_000);
    this.logger.log('Reservation worker started (interval=60s)');
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  private async tick() {
    if (this.isRunning) return;
    this.isRunning = true;
    try {
      const now = new Date();
      const expired = await this.orderModel
        .find({
          status: 'pending_payment',
          reservedUntil: { $exists: true, $lt: now },
        })
        .limit(50)
        .exec();

      for (const order of expired) {
        await this.cancelAndRelease(order._id, now);
      }
    } catch (e: any) {
      this.logger.error(`reservation tick failed: ${String(e?.message ?? e)}`);
    } finally {
      this.isRunning = false;
    }
  }

  private async cancelAndRelease(orderId: any, now: Date) {
    // CAS: only cancel if still pending and still expired
    const cancelled = await this.orderModel
      .findOneAndUpdate(
        { _id: orderId, status: 'pending_payment', reservedUntil: { $lt: now } },
        { $set: { status: 'cancelled_expired' } },
        { returnDocument: 'after' },
      )
      .exec();
    if (!cancelled) return;

    // Release reservations
    for (const it of cancelled.items as any[]) {
      const qty = Number(it.qty ?? 0);
      if (!qty) continue;
      if (it.variantId) {
        await this.variantModel
          .updateOne({ _id: it.variantId }, { $inc: { reserved: -qty } })
          .exec();
      } else {
        await this.productModel
          .updateOne({ _id: it.productId }, { $inc: { reserved: -qty } })
          .exec();
      }
    }

    this.logger.log(`released expired reservation order=${String(cancelled.orderCode)}`);
  }
}

