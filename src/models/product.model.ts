import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument } from 'mongoose';

export type ProductDocument = HydratedDocument<Product>;

export const ProductModelName = 'Product';

export type ProductStatus = 'active' | 'inactive';

@Schema({ timestamps: true })
export class Product {
  @Prop({ type: String, required: true, trim: true })
  name!: string;

  @Prop({ type: String, required: true, unique: true, index: true })
  slug!: string;

  @Prop({ type: String })
  description?: string;

  @Prop({ type: [String], default: [] })
  imageUrls!: string[];

  @Prop({ type: Number, required: true, min: 0, index: true })
  price!: number; // VND

  @Prop({ type: Number, required: true, min: 0, index: true })
  stock!: number;

  @Prop({
    type: String,
    enum: ['active', 'inactive'],
    default: 'active',
    index: true,
  })
  status!: ProductStatus;

  @Prop({ type: [String], default: [], index: true })
  tags!: string[];
}

export const ProductSchema = SchemaFactory.createForClass(Product);

ProductSchema.index({ status: 1, createdAt: -1 });
ProductSchema.index({ status: 1, price: 1 });
