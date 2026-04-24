import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument } from 'mongoose';

export type FollowDocument = HydratedDocument<Follow>;

export const FollowModelName = 'Follow';

@Schema({ timestamps: true })
export class Follow {
  @Prop({ type: String, required: true, index: true })
  followerId!: string;

  @Prop({ type: String, required: true, index: true })
  followeeId!: string;
}

export const FollowSchema = SchemaFactory.createForClass(Follow);

FollowSchema.index({ followerId: 1, followeeId: 1 }, { unique: true });
