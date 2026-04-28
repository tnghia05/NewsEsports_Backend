import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument } from 'mongoose';

export type PostSaveDocument = HydratedDocument<PostSave>;

export const PostSaveModelName = 'PostSave';

@Schema({ timestamps: true })
export class PostSave {
  @Prop({ type: String, required: true, index: true })
  postId!: string;

  @Prop({ type: String, required: true, index: true })
  userId!: string;
}

export const PostSaveSchema = SchemaFactory.createForClass(PostSave);

PostSaveSchema.index({ postId: 1, userId: 1 }, { unique: true });
PostSaveSchema.index({ userId: 1, createdAt: -1 });
