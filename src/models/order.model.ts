import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types, type HydratedDocument } from 'mongoose';
import { UserModelName } from './user.model';
import { ProductModelName } from './product.model';

export type OrderDocument = HydratedDocument<Order>;

export const OrderModelName = 'Order';

export type OrderStatus = 'pending_payment' | 'paid' | 'cancelled' | 'refunded';

export type OrderPaymentProvider = 'vnpay';

export class OrderItemSnapshot {
  @Prop({
    type: Types.ObjectId,
    ref: ProductModelName,
    required: true,
    index: true,
  })
  productId!: Types.ObjectId;

  @Prop({ type: String, required: true })
  name!: string;

  @Prop({ type: String, required: true })
  slug!: string;

  @Prop({ type: Number, required: true, min: 0 })
  unitPrice!: number;

  @Prop({ type: Number, required: true, min: 1 })
  qty!: number;

  @Prop({ type: Number, required: true, min: 0 })
  lineTotal!: number;
}

export class OrderPaymentSnapshot {
  @Prop({ type: String, enum: ['vnpay'], required: true })
  provider!: OrderPaymentProvider;

  @Prop({ type: String })
  providerTxnRef?: string; // txnRef we send to VNPay (orderCode)

  @Prop({ type: String })
  vnp_TxnRef?: string;

  @Prop({ type: String })
  vnp_TransactionNo?: string;

  @Prop({ type: String })
  vnp_BankCode?: string;

  @Prop({ type: String })
  vnp_ResponseCode?: string;

  @Prop({ type: String })
  vnp_TransactionStatus?: string;

  @Prop({ type: String })
  vnp_PayDate?: string;

  @Prop({ type: String })
  paidAt?: string;
}

@Schema({ timestamps: true })
export class Order {
  @Prop({
    type: Types.ObjectId,
    ref: UserModelName,
    required: true,
    index: true,
  })
  userId!: Types.ObjectId;

  @Prop({ type: String, required: true, unique: true, index: true })
  orderCode!: string; // e.g. OD20260428-000001

  @Prop({ type: [OrderItemSnapshot], required: true })
  items!: OrderItemSnapshot[];

  @Prop({ type: Number, required: true, min: 0 })
  subtotal!: number;

  @Prop({ type: Number, required: true, min: 0, default: 0 })
  shippingFee!: number;

  @Prop({ type: Number, required: true, min: 0 })
  total!: number;

  @Prop({
    type: String,
    enum: ['pending_payment', 'paid', 'cancelled', 'refunded'],
    default: 'pending_payment',
    index: true,
  })
  status!: OrderStatus;

  @Prop({ type: OrderPaymentSnapshot })
  payment?: OrderPaymentSnapshot;
}

export const OrderSchema = SchemaFactory.createForClass(Order);

OrderSchema.index({ userId: 1, createdAt: -1 });
OrderSchema.index({ status: 1, createdAt: -1 });
