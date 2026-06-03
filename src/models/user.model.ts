import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument } from 'mongoose';
export type UserDocument = HydratedDocument<User>;

export const UserModelName = 'User';

@Schema({ timestamps: true })
export class User {
  @Prop({
    required: true,
    unique: true,
    index: true,
    trim: true,
    lowercase: true,
  })
  email!: string;

  @Prop({ required: true })
  passwordHash!: string;

  @Prop({ required: true, trim: true })
  displayName!: string;

  @Prop({ trim: true })
  avatarUrl?: string;

  @Prop({
    trim: true,
    unique: true,
    sparse: true,
    index: true,
  })
  googleSub?: string;

  @Prop({
    required: true,
    enum: ['user', 'admin'],
    default: 'user',
  })
  role!: 'user' | 'admin';

  @Prop({ type: Number, default: 0, min: 0 })
  points!: number;

  // ── Ban / Moderation fields ──────────────────────────────────────
  /** Null = not banned; Date in future = temp ban; far future (2099) = permanent */
  @Prop({ type: Date, default: null, index: true })
  banUntil?: Date | null;

  @Prop({ type: String, default: null })
  banReason?: string | null;

  /** Number of times this user had a comment rejected as toxic */
  @Prop({ type: Number, default: 0, min: 0 })
  toxicStrikeCount!: number;

  /** Latest warning sent timestamp — avoid spam */
  @Prop({ type: Date, default: null })
  lastWarnedAt?: Date | null;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Search users (basic)
UserSchema.index({ displayName: 'text', email: 'text' });
