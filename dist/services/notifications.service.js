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
exports.NotificationsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const notification_model_1 = require("../models/notification.model");
let NotificationsService = class NotificationsService {
    notificationModel;
    constructor(notificationModel) {
        this.notificationModel = notificationModel;
    }
    async create(input) {
        if (input.actorId && input.actorId === input.userId)
            return { ok: true };
        await this.notificationModel.create({
            ...input,
            isRead: false,
        });
        return { ok: true };
    }
    async list(userId, opts) {
        const page = Math.max(1, Number(opts.page) || 1);
        const limit = Math.min(100, Math.max(1, Number(opts.limit) || 20));
        const skip = (page - 1) * limit;
        const filter = { userId };
        const [total, items] = await Promise.all([
            this.notificationModel.countDocuments(filter).exec(),
            this.notificationModel
                .find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .exec(),
        ]);
        return { items, page, limit, total, hasMore: skip + items.length < total };
    }
    async markRead(userId, notificationId) {
        const notif = await this.notificationModel.findById(notificationId).exec();
        if (!notif)
            throw new common_1.NotFoundException('Notification not found');
        if (notif.userId !== userId)
            throw new common_1.ForbiddenException('Forbidden');
        if (notif.isRead)
            return { ok: true };
        await this.notificationModel
            .updateOne({ _id: notif._id }, { $set: { isRead: true, readAt: new Date() } })
            .exec();
        return { ok: true };
    }
    async markAllRead(userId) {
        await this.notificationModel
            .updateMany({ userId, isRead: false }, { $set: { isRead: true, readAt: new Date() } })
            .exec();
        return { ok: true };
    }
};
exports.NotificationsService = NotificationsService;
exports.NotificationsService = NotificationsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(notification_model_1.NotificationModelName)),
    __metadata("design:paramtypes", [Function])
], NotificationsService);
//# sourceMappingURL=notifications.service.js.map