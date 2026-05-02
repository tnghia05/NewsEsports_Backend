import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { OrderModelName, type OrderDocument } from '../models/order.model';
import { OrderReservationsService } from './order-reservations.service';

@Injectable()
export class OrderReservationsWorkerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OrderReservationsWorkerService.name);
  private timer?: NodeJS.Timeout;
  private isRunning = false;

  constructor(
    @InjectModel(OrderModelName) private readonly orderModel: Model<OrderDocument>,
    private readonly reservations: OrderReservationsService,
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
    const started = Date.now();
    try {
      const now = new Date();
      const expired = await this.orderModel
        .find({
          status: 'pending_payment',
          reservedUntil: { $exists: true, $lt: now },
        })
        .limit(50)
        .exec();

      let cancelled = 0;
      for (const order of expired) {
        const did = await this.cancelAndRelease(order._id, now);
        if (did) cancelled += 1;
      }

      if (expired.length) {
        this.logger.log(
          `reservation_tick scanned=${expired.length} cancelled=${cancelled} ms=${Date.now() - started}`,
        );
      }
    } catch (e: any) {
      this.logger.error(
        `reservation tick failed: ${String(e?.message ?? e)} ms=${Date.now() - started}`,
      );
    } finally {
      this.isRunning = false;
    }
  }

  private async cancelAndRelease(orderId: any, now: Date): Promise<boolean> {
    // CAS: only cancel if still pending and still expired
    const cancelled = await this.orderModel
      .findOneAndUpdate(
        { _id: orderId, status: 'pending_payment', reservedUntil: { $lt: now } },
        { $set: { status: 'cancelled_expired' } },
        { returnDocument: 'after' },
      )
      .exec();
    if (!cancelled) return false;

    await this.reservations.releasePendingReservationIfNeeded(cancelled._id);

    this.logger.log(
      `released expired reservation order=${String(cancelled.orderCode)} id=${String(cancelled._id)}`,
    );
    return true;
  }
}

