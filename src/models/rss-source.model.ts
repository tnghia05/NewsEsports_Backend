import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument } from 'mongoose';

export type RssSourceDocument = HydratedDocument<RssSource>;

export const RssSourceModelName = 'RssSource';

@Schema({ timestamps: true })
export class RssSource {
  @Prop({ type: String, required: true, unique: true, index: true })
  url!: string;

  @Prop({ type: String })
  name?: string;

  @Prop({ type: Boolean, default: true, index: true })
  enabled!: boolean;

  @Prop({ type: String, index: true })
  createdBy?: string; // admin user id

  @Prop({ type: Date })
  lastImportedAt?: Date;

  @Prop({ type: String })
  lastError?: string;
}

export const RssSourceSchema = SchemaFactory.createForClass(RssSource);

RssSourceSchema.index({ enabled: 1, createdAt: -1 });

