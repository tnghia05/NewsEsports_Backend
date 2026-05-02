import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { OrderModelName, type OrderDocument } from '../models/order.model';
import {
  ProductModelName,
  type ProductDocument,
} from '../models/product.model';
import {
  ProductVariantModelName,
  type ProductVariantDocument,
} from '../models/product-variant.model';

/**
 * Centralizes inventory reservation/release logic so Orders, Payments, and workers
 * stay consistent and idempotent.
 */
@Injectable()
export class OrderReservationsService {
  private readonly logger = new Logger(OrderReservationsService.name);

  constructor(
    @InjectModel(OrderModelName)
    private readonly orderModel: Model<OrderDocument>,
    @InjectModel(ProductModelName)
    private readonly productModel: Model<ProductDocument>,
    @InjectModel(ProductVariantModelName)
    private readonly variantModel: Model<ProductVariantDocument>,
  ) {}

  /**
   * Release pending_payment reservations exactly once (CAS on reservationReleased=false).
   * Returns true if this call performed the release (or nothing to release), false if order not found.
   */
  async releasePendingReservationIfNeeded(orderId: any) {
    const order = await this.orderModel.findById(orderId).exec();
    if (!order) return false;

    const marked = await this.orderModel
      .updateOne(
        {
          _id: order._id,
          reservationReleased: false,
          status: {
            $in: ['pending_payment', 'cancelled', 'cancelled_expired'],
          },
        },
        { $set: { reservationReleased: true } },
      )
      .exec();

    if (marked.modifiedCount !== 1) {
      // Nothing to release (already released, or not a reservation-backed terminal state).
      return true;
    }

    for (const it of order.items as any[]) {
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

    this.logger.log(`released reservation order=${String(order.orderCode)}`);
    return true;
  }

  async releasePendingReservationByTxnRef(txnRef: string) {
    const order = await this.orderModel.findOne({ orderCode: txnRef }).exec();
    if (!order) return false;
    return this.releasePendingReservationIfNeeded(order._id);
  }

  /**
   * Mark inventory finalized (paid) exactly once. Used to decide whether admin cancel should restore stock.
   */
  async markInventoryFinalizedIfNeeded(orderId: any) {
    const res = await this.orderModel
      .updateOne(
        { _id: orderId, inventoryFinalized: false },
        { $set: { inventoryFinalized: true } },
      )
      .exec();
    return res.modifiedCount === 1;
  }

  /**
   * Restore sellable stock for a finalized order (does not touch reserved; assumes reserved is 0 post-finalize).
   */
  async restoreStockFromOrderItems(order: OrderDocument) {
    for (const it of order.items as any[]) {
      const qty = Number(it.qty ?? 0);
      if (!qty) continue;
      if (it.variantId) {
        await this.variantModel
          .updateOne({ _id: it.variantId }, { $inc: { stock: qty } })
          .exec();
      } else {
        await this.productModel
          .updateOne({ _id: it.productId }, { $inc: { stock: qty } })
          .exec();
      }
    }
  }
}
