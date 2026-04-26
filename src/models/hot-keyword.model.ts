import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument } from 'mongoose';

export type HotKeywordDocument = HydratedDocument<HotKeyword>;

export const HotKeywordModelName = 'HotKeyword';

export type HotKeywordWindow = '24h' | '7d';

export type Sentiment4Label = 'positive' | 'negative' | 'neutral' | 'toxic';
export type IntentLabel = 'praise' | 'complain' | 'question' | 'other';
export type AspectLabel =
  | 'caster'
  | 'meta'
  | 'player_team'
  | 'tournament'
  | 'result'
  | 'general';

export type HotKeywordTrend = {
  sampleCount: number; // number of items included in breakdown
  labeledCount: number; // number of samples successfully labeled by AI
  toxicCount: number; // number of samples that are toxic (from sentiment4=toxic or toxicity.isToxic)
  sentiment4: Partial<Record<Sentiment4Label, number>>;
  intent: Partial<Record<IntentLabel, number>>;
  aspect: Partial<Record<AspectLabel, number>>;
};

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

  @Prop({
    type: {
      sampleCount: { type: Number, required: true },
      labeledCount: { type: Number, required: true },
      toxicCount: { type: Number, required: true },
      sentiment4: { type: Object, required: true },
      intent: { type: Object, required: true },
      aspect: { type: Object, required: true },
    },
    default: undefined,
  })
  trend?: HotKeywordTrend;

  @Prop({ type: Date, required: true, index: true })
  updatedAt!: Date;
}

export const HotKeywordSchema = SchemaFactory.createForClass(HotKeyword);

HotKeywordSchema.index({ window: 1, score: -1 });
HotKeywordSchema.index({ window: 1, keyword: 1 }, { unique: true });

