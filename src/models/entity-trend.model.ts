import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument } from 'mongoose';

export type EntityTrendDocument = HydratedDocument<EntityTrend>;

export const EntityTrendModelName = 'EntityTrend';

export type EntityType = 'PLAYER' | 'TEAM' | 'TOURNAMENT';
export type EntityTrendWindow = '3h' | '24h' | '7d';

@Schema({ timestamps: true })
export class EntityTrend {
  @Prop({ type: String, required: true, index: true })
  entity!: string;

  @Prop({
    type: String,
    required: true,
    enum: ['PLAYER', 'TEAM', 'TOURNAMENT'],
  })
  entityType!: EntityType;

  @Prop({
    type: String,
    required: true,
    enum: ['3h', '24h', '7d'],
    index: true,
  })
  window!: EntityTrendWindow;

  @Prop({ type: Number, required: true, index: true })
  mentionCount!: number;

  @Prop({
    type: {
      positive: { type: Number, required: true },
      negative: { type: Number, required: true },
      neutral: { type: Number, required: true },
      toxic: { type: Number, required: true },
    },
    required: true,
  })
  sentiment!: {
    positive: number;
    negative: number;
    neutral: number;
    toxic: number;
  };

  // toxic / mentionCount
  @Prop({ type: Number, required: true })
  toxicRate!: number;

  @Prop({
    type: {
      praise: { type: Number, required: true },
      complain: { type: Number, required: true },
      question: { type: Number, required: true },
      other: { type: Number, required: true },
    },
    required: true,
  })
  intent!: {
    praise: number;
    complain: number;
    question: number;
    other: number;
  };

  @Prop({ type: Date, required: true, index: true })
  updatedAt!: Date;
}

export const EntityTrendSchema = SchemaFactory.createForClass(EntityTrend);

// Unique per (entity, type, window) — one doc per slot
EntityTrendSchema.index(
  { entity: 1, entityType: 1, window: 1 },
  { unique: true },
);
EntityTrendSchema.index({ window: 1, mentionCount: -1 });
EntityTrendSchema.index({ window: 1, entityType: 1, mentionCount: -1 });
