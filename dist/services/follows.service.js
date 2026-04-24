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
exports.FollowsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const follow_model_1 = require("../models/follow.model");
const user_model_1 = require("../models/user.model");
const notifications_service_1 = require("./notifications.service");
let FollowsService = class FollowsService {
    followModel;
    userModel;
    notificationsService;
    constructor(followModel, userModel, notificationsService) {
        this.followModel = followModel;
        this.userModel = userModel;
        this.notificationsService = notificationsService;
    }
    async listFolloweeIds(followerId) {
        const rows = await this.followModel
            .find({ followerId })
            .select({ followeeId: 1 })
            .lean()
            .exec();
        return rows.map((r) => r.followeeId);
    }
    async toggleFollow(followerId, followeeId) {
        if (followerId === followeeId)
            return { following: false };
        const existing = await this.followModel
            .findOne({ followerId, followeeId })
            .exec();
        if (existing) {
            await existing.deleteOne();
            return { following: false };
        }
        await this.followModel.create({ followerId, followeeId });
        await this.notificationsService.create({
            userId: followeeId,
            actorId: followerId,
            type: 'follow',
        });
        return { following: true };
    }
    async isFollowing(followerId, followeeId) {
        if (followerId === followeeId)
            return false;
        const exists = await this.followModel.exists({ followerId, followeeId });
        return Boolean(exists);
    }
    async listFollowers(followeeId, opts) {
        const page = Math.max(1, Number(opts.page) || 1);
        const limit = Math.min(100, Math.max(1, Number(opts.limit) || 20));
        const skip = (page - 1) * limit;
        const filter = { followeeId };
        const total = await this.followModel.countDocuments(filter).exec();
        const rows = await this.followModel
            .find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean()
            .exec();
        const ids = rows.map((r) => r.followerId);
        const users = await this.userModel
            .find({ _id: { $in: ids } })
            .select({ displayName: 1, avatarUrl: 1 })
            .lean()
            .exec();
        const byId = new Map(users.map((u) => [String(u._id), u]));
        return {
            items: ids
                .map((id) => {
                const u = byId.get(String(id));
                if (!u)
                    return undefined;
                return { id: String(id), displayName: u.displayName, avatarUrl: u.avatarUrl ?? undefined };
            })
                .filter(Boolean),
            page,
            limit,
            total,
            hasMore: skip + rows.length < total,
        };
    }
    async listFollowing(followerId, opts) {
        const page = Math.max(1, Number(opts.page) || 1);
        const limit = Math.min(100, Math.max(1, Number(opts.limit) || 20));
        const skip = (page - 1) * limit;
        const filter = { followerId };
        const total = await this.followModel.countDocuments(filter).exec();
        const rows = await this.followModel
            .find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean()
            .exec();
        const ids = rows.map((r) => r.followeeId);
        const users = await this.userModel
            .find({ _id: { $in: ids } })
            .select({ displayName: 1, avatarUrl: 1 })
            .lean()
            .exec();
        const byId = new Map(users.map((u) => [String(u._id), u]));
        return {
            items: ids
                .map((id) => {
                const u = byId.get(String(id));
                if (!u)
                    return undefined;
                return { id: String(id), displayName: u.displayName, avatarUrl: u.avatarUrl ?? undefined };
            })
                .filter(Boolean),
            page,
            limit,
            total,
            hasMore: skip + rows.length < total,
        };
    }
};
exports.FollowsService = FollowsService;
exports.FollowsService = FollowsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(follow_model_1.FollowModelName)),
    __param(1, (0, mongoose_1.InjectModel)(user_model_1.UserModelName)),
    __metadata("design:paramtypes", [Function, Function, notifications_service_1.NotificationsService])
], FollowsService);
//# sourceMappingURL=follows.service.js.map