import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument } from 'mongoose';

export type PostLikeDocument = HydratedDocument<PostLike>;

export const PostLikeModelName = 'PostLike';

@Schema({ timestamps: true })
export class PostLike {
  @Prop({ type: String, required: true, index: true })
  postId!: string;

  @Prop({ type: String, required: true, index: true })
  userId!: string;
}

export const PostLikeSchema = SchemaFactory.createForClass(PostLike);

PostLikeSchema.index({ postId: 1, userId: 1 }, { unique: true });
PostLikeSchema.index({ userId: 1, createdAt: -1 });

