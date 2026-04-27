import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument } from 'mongoose';
import type { AspectLabel, IntentLabel, Sentiment4Label } from './hot-keyword.model';

export type HotTopicDocument = HydratedDocument<HotTopic>;

export const HotTopicModelName = 'HotTopic';

export type HotTopicWindow = '3h' | '24h' | '7d';

export type HotTopicComponents = {
  read: number; // unique viewers (approx)
  discuss: number; // posts + comments
  originalUsers: number; // unique authors (posts)
};

export type HotTopicTrend = {
  sampleCount: number;
  labeledCount: number;
  toxicCount: number;
  sentiment4: Partial<Record<Sentiment4Label, number>>;
  intent: Partial<Record<IntentLabel, number>>;
  aspect: Partial<Record<AspectLabel, number>>;
  sentiment4Avg?: Partial<Record<Sentiment4Label, number>>;
  intentAvg?: Partial<Record<IntentLabel, number>>;
  aspectAvg?: Partial<Record<AspectLabel, number>>;
};

@Schema({ timestamps: true })
export class HotTopic {
  @Prop({ type: String, required: true, index: true })
  tag!: string;

  @Prop({
    type: String,
    required: true,
    enum: ['3h', '24h', '7d'],
    index: true,
  })
  window!: HotTopicWindow;

  // Weibo-style realtime hotness scale (0..10)
  @Prop({ type: Number, required: true, index: true })
  hotness!: number;

  @Prop({
    type: {
      read: { type: Number, required: true },
      discuss: { type: Number, required: true },
      originalUsers: { type: Number, required: true },
    },
    required: true,
  })
  components!: HotTopicComponents;

  @Prop({
    type: {
      sampleCount: { type: Number, required: true },
      labeledCount: { type: Number, required: true },
      toxicCount: { type: Number, required: true },
      sentiment4: { type: Object, required: true },
      intent: { type: Object, required: true },
      aspect: { type: Object, required: true },
      sentiment4Avg: { type: Object },
      intentAvg: { type: Object },
      aspectAvg: { type: Object },
    },
    default: undefined,
  })
  trend?: HotTopicTrend;

  @Prop({ type: Date, required: true, index: true })
  updatedAt!: Date;
}

export const HotTopicSchema = SchemaFactory.createForClass(HotTopic);

HotTopicSchema.index({ window: 1, hotness: -1 });
HotTopicSchema.index({ window: 1, tag: 1 }, { unique: true });

