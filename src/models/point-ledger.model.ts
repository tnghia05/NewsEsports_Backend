import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument } from 'mongoose';

export type PointLedgerDocument = HydratedDocument<PointLedger>;

export const PointLedgerModelName = 'PointLedger';

export type PointReason =
  | 'checkin'
  | 'post_publish'
  | 'comment_create'
  | 'prediction_win'
  | 'prediction_bet'
  | 'redeem_product'
  | 'checkout_discount'
  | 'admin_adjust';

@Schema({ timestamps: true })
export class PointLedger {
  @Prop({ type: String, required: true, index: true })
  userId!: string;

  @Prop({ type: Number, required: true })
  delta!: number;

  @Prop({ type: Number, required: true })
  balanceAfter!: number;

  @Prop({
    type: String,
    required: true,
    enum: [
      'checkin',
      'post_publish',
      'comment_create',
      'prediction_win',
      'prediction_bet',
      'redeem_product',
      'checkout_discount',
      'admin_adjust',
    ],
  })
  reason!: PointReason;

  @Prop({ type: Object })
  meta?: Record<string, unknown>;
}

export const PointLedgerSchema = SchemaFactory.createForClass(PointLedger);

PointLedgerSchema.index({ userId: 1, createdAt: -1 });
