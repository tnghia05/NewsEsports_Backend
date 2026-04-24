import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument } from 'mongoose';

export type CommentDocument = HydratedDocument<Comment>;

export const CommentModelName = 'Comment';

@Schema({ timestamps: true })
export class Comment {
  @Prop({ type: String, required: true, index: true })
  postId!: string;

  @Prop({ type: String, required: true, index: true })
  authorId!: string;

  @Prop({ type: String, required: true })
  content!: string;
}

export const CommentSchema = SchemaFactory.createForClass(Comment);

CommentSchema.index({ postId: 1, createdAt: 1 });
CommentSchema.index({ authorId: 1, createdAt: -1 });
