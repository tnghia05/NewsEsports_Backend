import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument } from 'mongoose';

export type CrawlSourceDocument = HydratedDocument<CrawlSource>;

export const CrawlSourceModelName = 'CrawlSource';

@Schema({ timestamps: true })
export class CrawlSource {
  @Prop({ type: String, required: true, unique: true, index: true })
  url!: string; // listing url, e.g. https://thethao247.vn/esports-c180/

  @Prop({ type: String })
  name?: string;

  @Prop({ type: Boolean, default: true, index: true })
  enabled!: boolean;

  @Prop({ type: String, index: true })
  createdBy?: string; // admin user id

  @Prop({ type: Date })
  lastCrawledAt?: Date;

  @Prop({ type: String })
  lastError?: string;
}

export const CrawlSourceSchema = SchemaFactory.createForClass(CrawlSource);

CrawlSourceSchema.index({ enabled: 1, createdAt: -1 });

