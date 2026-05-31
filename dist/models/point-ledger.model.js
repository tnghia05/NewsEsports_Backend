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
exports.PointLedgerSchema = exports.PointLedger = exports.PointLedgerModelName = void 0;
const mongoose_1 = require("@nestjs/mongoose");
exports.PointLedgerModelName = 'PointLedger';
let PointLedger = class PointLedger {
    userId;
    delta;
    balanceAfter;
    reason;
    meta;
};
exports.PointLedger = PointLedger;
__decorate([
    (0, mongoose_1.Prop)({ type: String, required: true, index: true }),
    __metadata("design:type", String)
], PointLedger.prototype, "userId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, required: true }),
    __metadata("design:type", Number)
], PointLedger.prototype, "delta", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, required: true }),
    __metadata("design:type", Number)
], PointLedger.prototype, "balanceAfter", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: String,
        required: true,
        enum: [
            'checkin',
            'post_publish',
            'comment_create',
            'prediction_win',
            'prediction_bet',
            'redeem_product',
            'checkout_discount',
            'admin_adjust',
        ],
    }),
    __metadata("design:type", String)
], PointLedger.prototype, "reason", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Object }),
    __metadata("design:type", Object)
], PointLedger.prototype, "meta", void 0);
exports.PointLedger = PointLedger = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], PointLedger);
exports.PointLedgerSchema = mongoose_1.SchemaFactory.createForClass(PointLedger);
exports.PointLedgerSchema.index({ userId: 1, createdAt: -1 });
//# sourceMappingURL=point-ledger.model.js.map