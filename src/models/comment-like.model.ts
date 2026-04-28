import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument } from 'mongoose';

export type CommentLikeDocument = HydratedDocument<CommentLike>;

export const CommentLikeModelName = 'CommentLike';

@Schema({ timestamps: true })
export class CommentLike {
  @Prop({ type: String, required: true, index: true })
  commentId!: string;

  @Prop({ type: String, required: true, index: true })
  userId!: string;
}

export const CommentLikeSchema = SchemaFactory.createForClass(CommentLike);

CommentLikeSchema.index({ commentId: 1, userId: 1 }, { unique: true });
CommentLikeSchema.index({ userId: 1, createdAt: -1 });
