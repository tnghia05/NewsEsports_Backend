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
exports.OrderSchema = exports.Order = exports.OrderPaymentSnapshot = exports.OrderItemSnapshot = exports.OrderModelName = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const user_model_1 = require("./user.model");
const product_model_1 = require("./product.model");
exports.OrderModelName = 'Order';
class OrderItemSnapshot {
    productId;
    name;
    slug;
    unitPrice;
    qty;
    lineTotal;
}
exports.OrderItemSnapshot = OrderItemSnapshot;
__decorate([
    (0, mongoose_1.Prop)({
        type: mongoose_2.Types.ObjectId,
        ref: product_model_1.ProductModelName,
        required: true,
        index: true,
    }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], OrderItemSnapshot.prototype, "productId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, required: true }),
    __metadata("design:type", String)
], OrderItemSnapshot.prototype, "name", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, required: true }),
    __metadata("design:type", String)
], OrderItemSnapshot.prototype, "slug", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, required: true, min: 0 }),
    __metadata("design:type", Number)
], OrderItemSnapshot.prototype, "unitPrice", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, required: true, min: 1 }),
    __metadata("design:type", Number)
], OrderItemSnapshot.prototype, "qty", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, required: true, min: 0 }),
    __metadata("design:type", Number)
], OrderItemSnapshot.prototype, "lineTotal", void 0);
class OrderPaymentSnapshot {
    provider;
    providerTxnRef;
    vnp_TxnRef;
    vnp_TransactionNo;
    vnp_BankCode;
    vnp_ResponseCode;
    vnp_TransactionStatus;
    vnp_PayDate;
    paidAt;
}
exports.OrderPaymentSnapshot = OrderPaymentSnapshot;
__decorate([
    (0, mongoose_1.Prop)({ type: String, enum: ['vnpay'], required: true }),
    __metadata("design:type", String)
], OrderPaymentSnapshot.prototype, "provider", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String }),
    __metadata("design:type", String)
], OrderPaymentSnapshot.prototype, "providerTxnRef", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String }),
    __metadata("design:type", String)
], OrderPaymentSnapshot.prototype, "vnp_TxnRef", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String }),
    __metadata("design:type", String)
], OrderPaymentSnapshot.prototype, "vnp_TransactionNo", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String }),
    __metadata("design:type", String)
], OrderPaymentSnapshot.prototype, "vnp_BankCode", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String }),
    __metadata("design:type", String)
], OrderPaymentSnapshot.prototype, "vnp_ResponseCode", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String }),
    __metadata("design:type", String)
], OrderPaymentSnapshot.prototype, "vnp_TransactionStatus", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String }),
    __metadata("design:type", String)
], OrderPaymentSnapshot.prototype, "vnp_PayDate", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String }),
    __metadata("design:type", String)
], OrderPaymentSnapshot.prototype, "paidAt", void 0);
let Order = class Order {
    userId;
    orderCode;
    items;
    subtotal;
    shippingFee;
    total;
    status;
    payment;
};
exports.Order = Order;
__decorate([
    (0, mongoose_1.Prop)({
        type: mongoose_2.Types.ObjectId,
        ref: user_model_1.UserModelName,
        required: true,
        index: true,
    }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Order.prototype, "userId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, required: true, unique: true, index: true }),
    __metadata("design:type", String)
], Order.prototype, "orderCode", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [OrderItemSnapshot], required: true }),
    __metadata("design:type", Array)
], Order.prototype, "items", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, required: true, min: 0 }),
    __metadata("design:type", Number)
], Order.prototype, "subtotal", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, required: true, min: 0, default: 0 }),
    __metadata("design:type", Number)
], Order.prototype, "shippingFee", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, required: true, min: 0 }),
    __metadata("design:type", Number)
], Order.prototype, "total", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: String,
        enum: ['pending_payment', 'paid', 'cancelled', 'refunded'],
        default: 'pending_payment',
        index: true,
    }),
    __metadata("design:type", String)
], Order.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: OrderPaymentSnapshot }),
    __metadata("design:type", OrderPaymentSnapshot)
], Order.prototype, "payment", void 0);
exports.Order = Order = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], Order);
exports.OrderSchema = mongoose_1.SchemaFactory.createForClass(Order);
exports.OrderSchema.index({ userId: 1, createdAt: -1 });
exports.OrderSchema.index({ status: 1, createdAt: -1 });
//# sourceMappingURL=order.model.js.map