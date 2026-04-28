import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types, type HydratedDocument } from 'mongoose';
import { OrderModelName } from './order.model';

export type PaymentDocument = HydratedDocument<Payment>;

export const PaymentModelName = 'Payment';

export type PaymentProvider = 'vnpay';
export type PaymentStatus = 'created' | 'redirected' | 'succeeded' | 'failed';

@Schema({ timestamps: true })
export class Payment {
  @Prop({
    type: Types.ObjectId,
    ref: OrderModelName,
    required: true,
    index: true,
  })
  orderId!: Types.ObjectId;

  @Prop({ type: String, enum: ['vnpay'], required: true, index: true })
  provider!: PaymentProvider;

  @Prop({ type: String, required: true, index: true })
  txnRef!: string; // orderCode (chosen by user)

  @Prop({ type: Number, required: true, min: 0 })
  amount!: number;

  @Prop({
    type: String,
    enum: ['created', 'redirected', 'succeeded', 'failed'],
    default: 'created',
    index: true,
  })
  status!: PaymentStatus;

  @Prop({ type: String })
  paymentUrl?: string;

  @Prop({ type: Object })
  vnpPayload?: Record<string, unknown>;

  @Prop({ type: Object })
  vnpVerify?: Record<string, unknown>;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);

PaymentSchema.index({ provider: 1, txnRef: 1 }, { unique: true });
