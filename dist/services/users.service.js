"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const user_model_1 = require("../models/user.model");
let UsersService = class UsersService {
    userModel;
    constructor(userModel) {
        this.userModel = userModel;
    }
    findById(id) {
        return this.userModel.findById(id).exec();
    }
    findByEmail(email) {
        return this.userModel.findOne({ email: email.toLowerCase().trim() }).exec();
    }
    findByGoogleSub(googleSub) {
        return this.userModel.findOne({ googleSub }).exec();
    }
    async createUser(input) {
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
    async linkGoogleSub(userId, googleSub, avatarUrl) {
        return this.userModel
            .findByIdAndUpdate(userId, { $set: { googleSub, ...(avatarUrl ? { avatarUrl } : {}) } }, { returnDocument: 'after' })
            .exec();
    }
    async updateUser(userId, update) {
        const patch = {};
        if (update.displayName !== undefined)
            patch.displayName = update.displayName.trim();
        if (update.avatarUrl !== undefined)
            patch.avatarUrl = update.avatarUrl.trim();
        return this.userModel
            .findByIdAndUpdate(userId, { $set: patch }, { returnDocument: 'after' })
            .exec();
    }
    async banUser(userId, opts) {
        const PERMANENT_DATE = new Date('2099-01-01T00:00:00Z');
        const banUntil = opts.durationDays === 0
            ? PERMANENT_DATE
            : new Date(Date.now() + opts.durationDays * 24 * 60 * 60 * 1000);
        return this.userModel
            .findByIdAndUpdate(userId, { $set: { banUntil, banReason: opts.reason.trim() } }, { returnDocument: 'after' })
            .exec();
    }
    async unbanUser(userId) {
        return this.userModel
            .findByIdAndUpdate(userId, { $set: { banUntil: null, banReason: null } }, { returnDocument: 'after' })
            .exec();
    }
    async listToxicUsers(opts) {
        const page = Math.max(1, opts.page || 1);
        const limit = Math.min(100, Math.max(1, opts.limit || 20));
        const skip = (page - 1) * limit;
        const minStrikes = opts.minStrikes ?? 1;
        const filter = { toxicStrikeCount: { $gte: minStrikes } };
        const [total, items] = await Promise.all([
            this.userModel.countDocuments(filter).exec(),
            this.userModel
                .find(filter)
                .select({ passwordHash: 0, googleSub: 0 })
                .sort({ toxicStrikeCount: -1, updatedAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean()
                .exec(),
        ]);
        return {
            items: items.map((u) => ({
                _id: u._id,
                displayName: u.displayName,
                email: u.email,
                avatarUrl: u.avatarUrl,
                toxicStrikeCount: u.toxicStrikeCount ?? 0,
                banUntil: u.banUntil ?? null,
                banReason: u.banReason ?? null,
                isBanned: u.banUntil ? new Date() < new Date(u.banUntil) : false,
                isPermanent: u.banUntil
                    ? new Date(u.banUntil).getFullYear() >= 2099
                    : false,
            })),
            page,
            limit,
            total,
            hasMore: skip + items.length < total,
        };
    }
    async isBanned(userId) {
        const user = await this.userModel
            .findById(userId)
            .select({ banUntil: 1, banReason: 1 })
            .lean()
            .exec();
        if (!user?.banUntil)
            return { banned: false };
        const now = new Date();
        if (new Date(user.banUntil) > now) {
            return { banned: true, until: user.banUntil, reason: user.banReason ?? undefined };
        }
        return { banned: false };
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(user_model_1.UserModelName)),
    __metadata("design:paramtypes", [Function])
], UsersService);
//# sourceMappingURL=users.service.js.map