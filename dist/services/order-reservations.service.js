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
var OrderReservationsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderReservationsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const order_model_1 = require("../models/order.model");
const product_model_1 = require("../models/product.model");
const product_variant_model_1 = require("../models/product-variant.model");
let OrderReservationsService = OrderReservationsService_1 = class OrderReservationsService {
    orderModel;
    productModel;
    variantModel;
    logger = new common_1.Logger(OrderReservationsService_1.name);
    constructor(orderModel, productModel, variantModel) {
        this.orderModel = orderModel;
        this.productModel = productModel;
        this.variantModel = variantModel;
    }
    async releasePendingReservationIfNeeded(orderId) {
        const order = await this.orderModel.findById(orderId).exec();
        if (!order)
            return false;
        const marked = await this.orderModel
            .updateOne({
            _id: order._id,
            reservationReleased: false,
            status: {
                $in: ['pending_payment', 'cancelled', 'cancelled_expired'],
            },
        }, { $set: { reservationReleased: true } })
            .exec();
        if (marked.modifiedCount !== 1) {
            return true;
        }
        for (const it of order.items) {
            const qty = Number(it.qty ?? 0);
            if (!qty)
                continue;
            if (it.variantId) {
                await this.variantModel
                    .updateOne({ _id: it.variantId }, { $inc: { reserved: -qty } })
                    .exec();
            }
            else {
                await this.productModel
                    .updateOne({ _id: it.productId }, { $inc: { reserved: -qty } })
                    .exec();
            }
        }
        this.logger.log(`released reservation order=${String(order.orderCode)}`);
        return true;
    }
    async releasePendingReservationByTxnRef(txnRef) {
        const order = await this.orderModel.findOne({ orderCode: txnRef }).exec();
        if (!order)
            return false;
        return this.releasePendingReservationIfNeeded(order._id);
    }
    async markInventoryFinalizedIfNeeded(orderId) {
        const res = await this.orderModel
            .updateOne({ _id: orderId, inventoryFinalized: false }, { $set: { inventoryFinalized: true } })
            .exec();
        return res.modifiedCount === 1;
    }
    async restoreStockFromOrderItems(order) {
        for (const it of order.items) {
            const qty = Number(it.qty ?? 0);
            if (!qty)
                continue;
            if (it.variantId) {
                await this.variantModel
                    .updateOne({ _id: it.variantId }, { $inc: { stock: qty } })
                    .exec();
            }
            else {
                await this.productModel
                    .updateOne({ _id: it.productId }, { $inc: { stock: qty } })
                    .exec();
            }
        }
    }
};
exports.OrderReservationsService = OrderReservationsService;
exports.OrderReservationsService = OrderReservationsService = OrderReservationsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(order_model_1.OrderModelName)),
    __param(1, (0, mongoose_1.InjectModel)(product_model_1.ProductModelName)),
    __param(2, (0, mongoose_1.InjectModel)(product_variant_model_1.ProductVariantModelName)),
    __metadata("design:paramtypes", [Function, Function, Function])
], OrderReservationsService);
//# sourceMappingURL=order-reservations.service.js.map