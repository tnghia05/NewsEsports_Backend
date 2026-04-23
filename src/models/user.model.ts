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
}

export const UserSchema = SchemaFactory.createForClass(User);
