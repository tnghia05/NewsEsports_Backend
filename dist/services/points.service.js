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
exports.PointsService = exports.POINT_REWARDS = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const user_model_1 = require("../models/user.model");
const point_ledger_model_1 = require("../models/point-ledger.model");
exports.POINT_REWARDS = {
    checkin: 10,
    post_publish: 20,
    comment_create: 5,
    prediction_win: 0,
    prediction_bet: 0,
    redeem_product: 0,
    checkout_discount: 0,
    admin_adjust: 0,
};
let PointsService = class PointsService {
    userModel;
    ledgerModel;
    constructor(userModel, ledgerModel) {
        this.userModel = userModel;
        this.ledgerModel = ledgerModel;
    }
    async getBalance(userId) {
        const user = await this.userModel
            .findById(userId)
            .select('points')
            .lean()
            .exec();
        if (!user)
            throw new common_1.NotFoundException('User not found');
        return user.points ?? 0;
    }
    async getHistory(userId, limit = 20, skip = 0) {
        const [items, total] = await Promise.all([
            this.ledgerModel
                .find({ userId })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean()
                .exec(),
            this.ledgerModel.countDocuments({ userId }),
        ]);
        return { items, total };
    }
    async addPoints(userId, delta, reason, meta) {
        const user = await this.userModel
            .findByIdAndUpdate(userId, { $inc: { points: delta } }, { new: true, select: 'points' })
            .lean()
            .exec();
        if (!user)
            throw new common_1.NotFoundException('User not found');
        const balanceAfter = user.points ?? 0;
        await this.ledgerModel.create({ userId, delta, balanceAfter, reason, meta });
        return balanceAfter;
    }
    async deductPoints(userId, amount, reason, meta) {
        if (amount <= 0)
            throw new common_1.BadRequestException('Amount must be positive');
        const current = await this.getBalance(userId);
        if (current < amount)
            throw new common_1.BadRequestException(`Không đủ điểm (cần ${amount}, hiện có ${current})`);
        return this.addPoints(userId, -amount, reason, meta);
    }
    async checkin(userId) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const existing = await this.ledgerModel
            .findOne({
            userId,
            reason: 'checkin',
            createdAt: { $gte: today, $lt: tomorrow },
        })
            .lean()
            .exec();
        if (existing) {
            const balance = await this.getBalance(userId);
            return { points: balance, alreadyDone: true };
        }
        const balance = await this.addPoints(userId, exports.POINT_REWARDS.checkin, 'checkin');
        return { points: balance, alreadyDone: false };
    }
};
exports.PointsService = PointsService;
exports.PointsService = PointsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(user_model_1.UserModelName)),
    __param(1, (0, mongoose_1.InjectModel)(point_ledger_model_1.PointLedgerModelName)),
    __metadata("design:paramtypes", [Function, Function])
], PointsService);
//# sourceMappingURL=points.service.js.map