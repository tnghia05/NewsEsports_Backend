import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument } from 'mongoose';

export type NewsDocument = HydratedDocument<News>;

export const NewsModelName = 'News';

export type NewsStatus = 'draft' | 'published';
export type NewsSource = 'admin' | 'rss';

@Schema({ timestamps: true })
export class News {
  @Prop({ type: String, required: true })
  title!: string;

  @Prop({ type: String, required: true, unique: true, index: true })
  slug!: string;

  @Prop({ type: String })
  excerpt?: string;

  @Prop({ type: String, required: true })
  content!: string;

  @Prop({ type: String })
  coverImageUrl?: string;

  @Prop({ type: [String], default: [], index: true })
  tags!: string[];

  @Prop({ type: String, enum: ['draft', 'published'], default: 'draft', index: true })
  status!: NewsStatus;

  @Prop({ type: Date, index: true })
  publishedAt?: Date;

  @Prop({ type: String, enum: ['admin', 'rss'], default: 'admin', index: true })
  source!: NewsSource;

  // Admin author id (for source=admin). Keep string to match other models.
  @Prop({ type: String, index: true })
  authorId?: string;

  // RSS fields (for source=rss)
  @Prop({ type: String, index: true })
  sourceUrl?: string; // feed url

  @Prop({ type: String, index: true })
  externalUrl?: string; // item link

  @Prop({ type: String, index: true })
  externalId?: string; // guid or hash for dedup
}

export const NewsSchema = SchemaFactory.createForClass(News);

// Common queries
NewsSchema.index({ status: 1, publishedAt: -1, createdAt: -1 });
NewsSchema.index({ source: 1, externalId: 1 }, { unique: true, sparse: true });
NewsSchema.index({ source: 1, externalUrl: 1 }, { unique: true, sparse: true });

