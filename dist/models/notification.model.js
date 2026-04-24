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
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationSchema = exports.Notification = exports.NotificationModelName = void 0;
const mongoose_1 = require("@nestjs/mongoose");
exports.NotificationModelName = 'Notification';
let Notification = class Notification {
    userId;
    actorId;
    type;
    postId;
    commentId;
    isRead;
    readAt;
};
exports.Notification = Notification;
__decorate([
    (0, mongoose_1.Prop)({ type: String, required: true, index: true }),
    __metadata("design:type", String)
], Notification.prototype, "userId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, index: true }),
    __metadata("design:type", String)
], Notification.prototype, "actorId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, required: true, index: true }),
    __metadata("design:type", String)
], Notification.prototype, "type", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, index: true }),
    __metadata("design:type", String)
], Notification.prototype, "postId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, index: true }),
    __metadata("design:type", String)
], Notification.prototype, "commentId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Boolean, default: false, index: true }),
    __metadata("design:type", Boolean)
], Notification.prototype, "isRead", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date }),
    __metadata("design:type", Date)
], Notification.prototype, "readAt", void 0);
exports.Notification = Notification = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], Notification);
exports.NotificationSchema = mongoose_1.SchemaFactory.createForClass(Notification);
exports.NotificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
//# sourceMappingURL=notification.model.js.map