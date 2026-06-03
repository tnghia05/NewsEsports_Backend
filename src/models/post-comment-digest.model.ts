import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument } from 'mongoose';

export type PostCommentDigestDocument = HydratedDocument<PostCommentDigest>;

export const PostCommentDigestModelName = 'PostCommentDigest';

@Schema({ timestamps: true })
export class PostCommentDigest {
  /** The post this digest belongs to */
  @Prop({ type: String, required: true, unique: true, index: true })
  postId!: string;

  /** AI-generated natural language summary (null if Gemini key not set) */
  @Prop({ type: String, default: null })
  summary!: string | null;

  /** Aggregated stats computed from all approved comments */
  @Prop({ type: Object })
  aggregate!: {
    commentCount: number;
    sentiment: { positive: number; neutral: number; negative: number };
    sentiment4: { positive: number; negative: number; neutral: number; toxic: number };
    intent: { praise: number; complain: number; question: number; other: number };
    aspects: Record<string, number>;
    avgQualityScore: number;
    avgToxicityScore: number;
    toxicCount: number;
  };

  /** Number of approved comments when digest was last built */
  @Prop({ type: Number, required: true })
  commentCount!: number;

  /** createdAt of the newest approved comment included in the digest */
  @Prop({ type: Date })
  lastCommentAt?: Date;

  /** When the Gemini text was last regenerated */
  @Prop({ type: Date })
  generatedAt?: Date;
}

export const PostCommentDigestSchema = SchemaFactory.createForClass(PostCommentDigest);
