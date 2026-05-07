import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument } from 'mongoose';

export type AdminAlertDocument = HydratedDocument<AdminAlert>;
export const AdminAlertModelName = 'AdminAlert';
export type AdminAlertType = 'toxicity_spike';

@Schema({ timestamps: true })
export class AdminAlert {
  @Prop({ type: String, required: true, index: true })
  type!: AdminAlertType;

  @Prop({ type: String, required: true, index: true })
  tag!: string;

  @Prop({ type: Number, required: true })
  ratio3h!: number;

  @Prop({ type: Number, required: true })
  ratio24h!: number;

  @Prop({ type: Boolean, default: false, index: true })
  isRead!: boolean;
}

export const AdminAlertSchema = SchemaFactory.createForClass(AdminAlert);

AdminAlertSchema.index({ type: 1, createdAt: -1 });
AdminAlertSchema.index({ isRead: 1, createdAt: -1 });
