import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument } from 'mongoose';

export type PostDocument = HydratedDocument<Post>;

export const PostModelName = 'Post';

@Schema({ timestamps: true })
export class Post {
  @Prop({ type: String, required: true, index: true })
  authorId!: string;

  @Prop({ type: String, required: true, trim: true })
  title!: string;

  @Prop({ type: String, required: true })
  content!: string;

  @Prop({ type: String, trim: true })
  thumbnailUrl?: string;

  @Prop({ type: String, required: true, trim: true, index: true })
  game!: string;

  @Prop({ type: String, trim: true })
  tournament?: string;

  @Prop({ type: [String], default: [] })
  tags!: string[];

  @Prop({
    type: String,
    required: true,
    enum: ['draft', 'published'],
    default: 'draft',
    index: true,
  })
  status!: 'draft' | 'published';

  @Prop({ type: Number, default: 0 })
  viewCount!: number;

  @Prop({ type: Number, default: 0 })
  commentCount!: number;

  @Prop({ type: Number, default: 0 })
  likeCount!: number;

  @Prop({ type: Boolean, default: false, index: true })
  isPinned!: boolean;

  @Prop({ type: Date })
  pinnedAt?: Date;
}

export const PostSchema = SchemaFactory.createForClass(Post);

PostSchema.index({ status: 1, createdAt: -1 });
PostSchema.index({ status: 1, game: 1, createdAt: -1 });
PostSchema.index({ status: 1, tags: 1, createdAt: -1 });
PostSchema.index({ authorId: 1, status: 1, createdAt: -1 });
