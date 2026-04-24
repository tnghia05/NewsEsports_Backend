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
let FollowsService = class FollowsService {
    followModel;
    constructor(followModel) {
        this.followModel = followModel;
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
        return { following: true };
    }
};
exports.FollowsService = FollowsService;
exports.FollowsService = FollowsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(follow_model_1.FollowModelName)),
    __metadata("design:paramtypes", [Function])
], FollowsService);
//# sourceMappingURL=follows.service.js.map