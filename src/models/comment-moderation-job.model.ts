import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument } from 'mongoose';
//s
export type CommentModerationJobDocument = HydratedDocument<CommentModerationJob>;

export const CommentModerationJobModelName = 'CommentModerationJob';

export type ModerationJobStatus = 'pending' | 'processing' | 'done' | 'failed';

@Schema({ timestamps: true })
export class CommentModerationJob {
  @Prop({ type: String, required: true, index: true, unique: true })
  commentId!: string;

  @Prop({
    type: String,
    required: true,
    enum: ['pending', 'processing', 'done', 'failed'],
    default: 'pending',
    index: true,
  })
  status!: ModerationJobStatus;

  @Prop({ type: Number, default: 0 })
  attempts!: number;

  @Prop({ type: Date, index: true })
  nextRunAt?: Date;

  @Prop({ type: Date })
  lockedAt?: Date;

  @Prop({ type: String })
  lastError?: string;
}

export const CommentModerationJobSchema =
  SchemaFactory.createForClass(CommentModerationJob);

CommentModerationJobSchema.index({ status: 1, nextRunAt: 1, createdAt: 1 });

