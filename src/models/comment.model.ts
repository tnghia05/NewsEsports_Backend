import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument } from 'mongoose';

export type CommentDocument = HydratedDocument<Comment>;

export const CommentModelName = 'Comment';

export type CommentModerationStatus = 'pending' | 'approved' | 'rejected';
export type CommentSentiment = 'positive' | 'neutral' | 'negative';

@Schema({ timestamps: true })
export class Comment {
  @Prop({ type: String, required: true, index: true })
  postId!: string;

  @Prop({ type: String, index: true })
  parentId?: string;

  @Prop({ type: String, required: true, index: true })
  authorId!: string;

  @Prop({ type: String, required: true })
  content!: string;

  @Prop({
    type: String,
    required: true,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
    index: true,
  })
  moderationStatus!: CommentModerationStatus;

  @Prop({ type: String, enum: ['positive', 'neutral', 'negative'], index: true })
  sentiment?: CommentSentiment;

  @Prop({
    type: {
      isToxic: { type: Boolean, required: true },
      score: { type: Number, required: true },
    },
  })
  toxicity?: { isToxic: boolean; score: number };

  @Prop({ type: String })
  aiVersion?: string;

  @Prop({ type: String })
  aiError?: string;

  @Prop({ type: Number, default: 0 })
  likeCount!: number;

  @Prop({ type: Boolean, default: false, index: true })
  isDeleted!: boolean;

  @Prop({ type: Date })
  deletedAt?: Date;
}

export const CommentSchema = SchemaFactory.createForClass(Comment);

CommentSchema.index({ postId: 1, createdAt: 1 });
CommentSchema.index({ postId: 1, parentId: 1, createdAt: 1 });
CommentSchema.index({ authorId: 1, createdAt: -1 });
