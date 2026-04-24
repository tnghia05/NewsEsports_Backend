import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument } from 'mongoose';

export type NotificationDocument = HydratedDocument<Notification>;

export const NotificationModelName = 'Notification';

export type NotificationType = 'comment' | 'reply' | 'follow' | 'post_like';

@Schema({ timestamps: true })
export class Notification {
  @Prop({ type: String, required: true, index: true })
  userId!: string; // recipient

  @Prop({ type: String, index: true })
  actorId?: string; // who did it

  @Prop({ type: String, required: true, index: true })
  type!: NotificationType;

  @Prop({ type: String, index: true })
  postId?: string;

  @Prop({ type: String, index: true })
  commentId?: string;

  @Prop({ type: Boolean, default: false, index: true })
  isRead!: boolean;

  @Prop({ type: Date })
  readAt?: Date;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);

NotificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

