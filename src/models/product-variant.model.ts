import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types, type HydratedDocument } from 'mongoose';
import { ProductModelName } from './product.model';

export type ProductVariantDocument = HydratedDocument<ProductVariant>;

export const ProductVariantModelName = 'ProductVariant';

export type ProductVariantStatus = 'active' | 'inactive';

export class VariantOption {
  @Prop({ type: String, required: true })
  k!: string; // e.g. 'size', 'color', 'zone'

  @Prop({ type: String, required: true })
  v!: string; // e.g. 'M', 'black', 'A'
}

@Schema({ timestamps: true })
export class ProductVariant {
  @Prop({ type: Types.ObjectId, ref: ProductModelName, required: true, index: true })
  productId!: Types.ObjectId;

  @Prop({ type: String, required: true, trim: true })
  title!: string; // e.g. "Black / Size M", "Zone A"

  @Prop({ type: String, required: true, unique: true, index: true, trim: true })
  skuCode!: string;

  @Prop({ type: [VariantOption], default: [] })
  options!: VariantOption[];

  @Prop({ type: Number, required: true, min: 0, index: true })
  price!: number; // VND

  @Prop({ type: Number, required: true, min: 0, index: true })
  stock!: number;

  @Prop({ type: Number, required: true, min: 0, default: 0, index: true })
  reserved!: number;

  @Prop({
    type: String,
    enum: ['active', 'inactive'],
    default: 'active',
    index: true,
  })
  status!: ProductVariantStatus;
}

export const ProductVariantSchema = SchemaFactory.createForClass(ProductVariant);

ProductVariantSchema.index({ productId: 1, status: 1, createdAt: -1 });
ProductVariantSchema.index({ productId: 1, skuCode: 1 });

