import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument } from 'mongoose';

export type HashtagEventDocument = HydratedDocument<HashtagEvent>;

export const HashtagEventModelName = 'HashtagEvent';

export type HashtagEventAction = 'view';

@Schema({ timestamps: true })
export class HashtagEvent {
  @Prop({ type: String })
  userId?: string;

  @Prop({ type: String, index: true })
  sessionId?: string;

  @Prop({ type: String, required: true, index: true })
  tag!: string; // normalized (no leading #)

  @Prop({ type: String, required: true, enum: ['view'], index: true })
  action!: HashtagEventAction;
}

export const HashtagEventSchema = SchemaFactory.createForClass(HashtagEvent);

HashtagEventSchema.index({ createdAt: -1, action: 1 });
HashtagEventSchema.index({ tag: 1, createdAt: -1 });
HashtagEventSchema.index({ userId: 1, createdAt: -1 });
