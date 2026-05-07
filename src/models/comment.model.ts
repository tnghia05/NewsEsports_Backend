import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument } from 'mongoose';

export type CommentDocument = HydratedDocument<Comment>;

export const CommentModelName = 'Comment';

export type CommentModerationStatus = 'pending' | 'approved' | 'rejected' | 'under_review';
export type CommentSentiment = 'positive' | 'neutral' | 'negative';

@Schema({ timestamps: true })
export class Comment {
  /** Present when comment belongs to a feed post */
  @Prop({ type: String, index: true })
  postId?: string;

  /** Present when comment belongs to a news article */
  @Prop({ type: String, index: true })
  newsId?: string;

  @Prop({ type: String, index: true })
  parentId?: string;

  @Prop({ type: String, required: true, index: true })
  authorId!: string;

  @Prop({ type: String, required: true })
  content!: string;

  @Prop({
    type: String,
    required: true,
    enum: ['pending', 'approved', 'rejected', 'under_review'],
    default: 'pending',
    index: true,
  })
  moderationStatus!: CommentModerationStatus;

  @Prop({
    type: String,
    enum: ['positive', 'neutral', 'negative'],
    index: true,
  })
  sentiment?: CommentSentiment;

  @Prop({
    type: {
      isToxic: { type: Boolean, required: true },
      score: { type: Number, required: true },
    },
  })
  toxicity?: { isToxic: boolean; score: number };

  @Prop({
    type: String,
    enum: ['positive', 'negative', 'neutral', 'toxic'],
    index: true,
  })
  sentiment4?: string;

  @Prop({ type: String, enum: ['praise', 'complain', 'question', 'other'] })
  intent?: string;

  @Prop({ type: [String] })
  aspects?: string[];

  @Prop({ type: Object })
  sentiment4Scores?: Record<string, number>;

  @Prop({ type: Object })
  intentScores?: Record<string, number>;

  @Prop({ type: Object })
  aspectScores?: Record<string, number>;

  @Prop({ type: String })
  aiVersion?: string;

  @Prop({ type: String })
  aiError?: string;

  @Prop({ type: Number })
  qualityScore?: number;

  @Prop({ type: [{ text: String, type: String }] })
  aiEntities?: { text: string; type: string }[];

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
CommentSchema.index({ newsId: 1, createdAt: 1 });
CommentSchema.index({ newsId: 1, parentId: 1, createdAt: 1 });
CommentSchema.index({ authorId: 1, createdAt: -1 });
