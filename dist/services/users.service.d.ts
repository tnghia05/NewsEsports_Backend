import type { Model } from 'mongoose';
import { type UserDocument } from '../models/user.model';
type CreateUserInput = {
    email: string;
    passwordHash: string;
    displayName: string;
    avatarUrl?: string;
    googleSub?: string;
    role?: 'user' | 'admin';
};
export declare class UsersService {
    private readonly userModel;
    constructor(userModel: Model<UserDocument>);
    findById(id: string): Promise<(import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, import("../models/user.model").User, {}, import("mongoose").DefaultSchemaOptions> & import("../models/user.model").User & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    }, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").Document<unknown, {}, import("../models/user.model").User, {}, import("mongoose").DefaultSchemaOptions> & import("../models/user.model").User & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    } & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>) | null>;
    findByEmail(email: string): Promise<(import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, import("../models/user.model").User, {}, import("mongoose").DefaultSchemaOptions> & import("../models/user.model").User & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    }, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").Document<unknown, {}, import("../models/user.model").User, {}, import("mongoose").DefaultSchemaOptions> & import("../models/user.model").User & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    } & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>) | null>;
    findByGoogleSub(googleSub: string): Promise<(import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, import("../models/user.model").User, {}, import("mongoose").DefaultSchemaOptions> & import("../models/user.model").User & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    }, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").Document<unknown, {}, import("../models/user.model").User, {}, import("mongoose").DefaultSchemaOptions> & import("../models/user.model").User & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    } & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>) | null>;
    createUser(input: CreateUserInput): Promise<import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, import("../models/user.model").User, {}, import("mongoose").DefaultSchemaOptions> & import("../models/user.model").User & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    }, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").Document<unknown, {}, import("../models/user.model").User, {}, import("mongoose").DefaultSchemaOptions> & import("../models/user.model").User & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    } & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>>;
    linkGoogleSub(userId: string, googleSub: string, avatarUrl?: string): Promise<(import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, import("../models/user.model").User, {}, import("mongoose").DefaultSchemaOptions> & import("../models/user.model").User & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    }, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").Document<unknown, {}, import("../models/user.model").User, {}, import("mongoose").DefaultSchemaOptions> & import("../models/user.model").User & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    } & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>) | null>;
}
export {};
