import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument } from 'mongoose';

export type PredictionDocument = HydratedDocument<Prediction>;

export const PredictionModelName = 'Prediction';

export type PredictionStatus = 'pending' | 'won' | 'lost' | 'cancelled';

@Schema({ timestamps: true })
export class Prediction {
  @Prop({ type: String, required: true, index: true })
  userId!: string;

  @Prop({ type: String, required: true, index: true })
  matchId!: string;

  @Prop({ type: Number, required: true })
  teamIndex!: number;

  @Prop({ type: String, required: true })
  teamName!: string;

  @Prop({ type: Number, required: true, min: 1 })
  pointsBet!: number;

  @Prop({ type: Number, required: true })
  oddsAtBet!: number;

  @Prop({
    type: String,
    required: true,
    enum: ['pending', 'won', 'lost', 'cancelled'],
    default: 'pending',
    index: true,
  })
  status!: PredictionStatus;

  @Prop({ type: Number })
  pointsWon?: number;

  @Prop({ type: Date })
  settledAt?: Date;
}

export const PredictionSchema = SchemaFactory.createForClass(Prediction);

PredictionSchema.index({ userId: 1, createdAt: -1 });
PredictionSchema.index({ matchId: 1, status: 1 });
PredictionSchema.index({ userId: 1, matchId: 1 }, { unique: true });
