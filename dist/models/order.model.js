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
exports.OrderSchema = exports.Order = exports.OrderAuditEntry = exports.OrderPaymentSnapshot = exports.OrderItemSnapshot = exports.OrderModelName = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const user_model_1 = require("./user.model");
const product_model_1 = require("./product.model");
exports.OrderModelName = 'Order';
class OrderItemSnapshot {
    productId;
    variantId;
    name;
    slug;
    variantTitle;
    skuCode;
    variantOptions;
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
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, required: false, index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], OrderItemSnapshot.prototype, "variantId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, required: true }),
    __metadata("design:type", String)
], OrderItemSnapshot.prototype, "name", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, required: true }),
    __metadata("design:type", String)
], OrderItemSnapshot.prototype, "slug", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String }),
    __metadata("design:type", String)
], OrderItemSnapshot.prototype, "variantTitle", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String }),
    __metadata("design:type", String)
], OrderItemSnapshot.prototype, "skuCode", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [{ k: String, v: String }], default: [] }),
    __metadata("design:type", Array)
], OrderItemSnapshot.prototype, "variantOptions", void 0);
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
class OrderAuditEntry {
    at;
    actorId;
    actorRole;
    action;
    message;
    meta;
}
exports.OrderAuditEntry = OrderAuditEntry;
__decorate([
    (0, mongoose_1.Prop)({ type: Date, required: true, default: () => new Date() }),
    __metadata("design:type", Date)
], OrderAuditEntry.prototype, "at", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], OrderAuditEntry.prototype, "actorId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, required: true }),
    __metadata("design:type", String)
], OrderAuditEntry.prototype, "actorRole", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, required: true }),
    __metadata("design:type", String)
], OrderAuditEntry.prototype, "action", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String }),
    __metadata("design:type", String)
], OrderAuditEntry.prototype, "message", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Object }),
    __metadata("design:type", Object)
], OrderAuditEntry.prototype, "meta", void 0);
let Order = class Order {
    userId;
    orderCode;
    items;
    receiverName;
    receiverPhone;
    receiverEmail;
    shippingAddress;
    shippingMethod;
    trackingCode;
    reservationReleased;
    inventoryFinalized;
    cancelReason;
    cancelledAt;
    internalNotes;
    auditLog;
    reservedUntil;
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
    (0, mongoose_1.Prop)({ type: String }),
    __metadata("design:type", String)
], Order.prototype, "receiverName", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String }),
    __metadata("design:type", String)
], Order.prototype, "receiverPhone", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String }),
    __metadata("design:type", String)
], Order.prototype, "receiverEmail", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String }),
    __metadata("design:type", String)
], Order.prototype, "shippingAddress", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String }),
    __metadata("design:type", String)
], Order.prototype, "shippingMethod", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String }),
    __metadata("design:type", String)
], Order.prototype, "trackingCode", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Boolean, default: false, index: true }),
    __metadata("design:type", Boolean)
], Order.prototype, "reservationReleased", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Boolean, default: false, index: true }),
    __metadata("design:type", Boolean)
], Order.prototype, "inventoryFinalized", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String }),
    __metadata("design:type", String)
], Order.prototype, "cancelReason", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date }),
    __metadata("design:type", Date)
], Order.prototype, "cancelledAt", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, maxlength: 4000 }),
    __metadata("design:type", String)
], Order.prototype, "internalNotes", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [OrderAuditEntry], default: [] }),
    __metadata("design:type", Array)
], Order.prototype, "auditLog", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date, index: true }),
    __metadata("design:type", Date)
], Order.prototype, "reservedUntil", void 0);
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
        enum: [
            'pending_payment',
            'paid',
            'processing',
            'shipped',
            'delivered',
            'cancelled',
            'cancelled_expired',
            'refunded',
        ],
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
exports.OrderSchema.index({ status: 1, reservedUntil: 1 });
exports.OrderSchema.index({ status: 1, orderCode: 1 });
//# sourceMappingURL=order.model.js.map