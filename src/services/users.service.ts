import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { UserModelName, type UserDocument } from '../models/user.model';

type CreateUserInput = {
  email: string;
  passwordHash: string;
  displayName: string;
  avatarUrl?: string;
  googleSub?: string;
  role?: 'user' | 'admin';
};

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(UserModelName) private readonly userModel: Model<UserDocument>,
  ) {}

  findById(id: string) {
    return this.userModel.findById(id).exec();
  }

  findByEmail(email: string) {
    return this.userModel.findOne({ email: email.toLowerCase().trim() }).exec();
  }

  findByGoogleSub(googleSub: string) {
    return this.userModel.findOne({ googleSub }).exec();
  }

  async createUser(input: CreateUserInput) {
    const doc = await this.userModel.create({
      email: input.email.toLowerCase().trim(),
      passwordHash: input.passwordHash,
      displayName: input.displayName.trim(),
      avatarUrl: input.avatarUrl,
      googleSub: input.googleSub,
      role: input.role ?? 'user',
    });
    return doc;
  }

  async linkGoogleSub(userId: string, googleSub: string, avatarUrl?: string) {
    return this.userModel
      .findByIdAndUpdate(
        userId,
        { $set: { googleSub, ...(avatarUrl ? { avatarUrl } : {}) } },
        { new: true },
      )
      .exec();
  }
}
