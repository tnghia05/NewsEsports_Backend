import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument } from 'mongoose';

export type SearchEventDocument = HydratedDocument<SearchEvent>;

export const SearchEventModelName = 'SearchEvent';

export type SearchEventAction = 'search' | 'click';
export type SearchEventTargetType = 'post' | 'comment' | 'news' | 'user' | 'other';

@Schema({ timestamps: true })
export class SearchEvent {
  @Prop({ type: String })
  userId?: string;

  @Prop({ type: String, index: true })
  sessionId?: string;

  @Prop({ type: String, required: true, index: true })
  q!: string; // normalized keyword

  @Prop({
    type: String,
    required: true,
    enum: ['search', 'click'],
    index: true,
  })
  action!: SearchEventAction;

  @Prop({
    type: String,
    enum: ['post', 'comment', 'news', 'user', 'other'],
  })
  targetType?: SearchEventTargetType;

  @Prop({ type: String })
  targetId?: string;
}

export const SearchEventSchema = SchemaFactory.createForClass(SearchEvent);

SearchEventSchema.index({ createdAt: -1, action: 1 });
SearchEventSchema.index({ q: 1, createdAt: -1 });
SearchEventSchema.index({ userId: 1, createdAt: -1 });

