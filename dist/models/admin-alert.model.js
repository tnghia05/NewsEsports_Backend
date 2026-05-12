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
exports.AdminAlertSchema = exports.AdminAlert = exports.AdminAlertModelName = void 0;
const mongoose_1 = require("@nestjs/mongoose");
exports.AdminAlertModelName = 'AdminAlert';
let AdminAlert = class AdminAlert {
    type;
    tag;
    ratio3h;
    ratio24h;
    isRead;
};
exports.AdminAlert = AdminAlert;
__decorate([
    (0, mongoose_1.Prop)({ type: String, required: true, index: true }),
    __metadata("design:type", String)
], AdminAlert.prototype, "type", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, required: true, index: true }),
    __metadata("design:type", String)
], AdminAlert.prototype, "tag", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, required: true }),
    __metadata("design:type", Number)
], AdminAlert.prototype, "ratio3h", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, required: true }),
    __metadata("design:type", Number)
], AdminAlert.prototype, "ratio24h", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Boolean, default: false, index: true }),
    __metadata("design:type", Boolean)
], AdminAlert.prototype, "isRead", void 0);
exports.AdminAlert = AdminAlert = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], AdminAlert);
exports.AdminAlertSchema = mongoose_1.SchemaFactory.createForClass(AdminAlert);
exports.AdminAlertSchema.index({ type: 1, createdAt: -1 });
exports.AdminAlertSchema.index({ isRead: 1, createdAt: -1 });
//# sourceMappingURL=admin-alert.model.js.map