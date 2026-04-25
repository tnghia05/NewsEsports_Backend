import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument } from 'mongoose';

export type HotKeywordDocument = HydratedDocument<HotKeyword>;

export const HotKeywordModelName = 'HotKeyword';

export type HotKeywordWindow = '24h' | '7d';

@Schema({ timestamps: true })
export class HotKeyword {
  @Prop({ type: String, required: true, index: true })
  keyword!: string;

  @Prop({
    type: String,
    required: true,
    enum: ['24h', '7d'],
    index: true,
  })
  window!: HotKeywordWindow;

  @Prop({ type: Number, required: true, index: true })
  score!: number;

  @Prop({ type: Date, required: true, index: true })
  updatedAt!: Date;
}

export const HotKeywordSchema = SchemaFactory.createForClass(HotKeyword);

HotKeywordSchema.index({ window: 1, score: -1 });
HotKeywordSchema.index({ window: 1, keyword: 1 }, { unique: true });

