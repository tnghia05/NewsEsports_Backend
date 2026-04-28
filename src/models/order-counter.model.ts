import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument } from 'mongoose';

export type OrderCounterDocument = HydratedDocument<OrderCounter>;

export const OrderCounterModelName = 'OrderCounter';

@Schema({ timestamps: true })
export class OrderCounter {
  @Prop({ type: String, required: true, unique: true, index: true })
  key!: string; // e.g. 'order:20260428'

  @Prop({ type: Number, required: true, default: 0 })
  seq!: number;
}

export const OrderCounterSchema = SchemaFactory.createForClass(OrderCounter);
