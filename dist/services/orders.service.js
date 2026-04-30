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
exports.OrdersService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const order_counter_model_1 = require("../models/order-counter.model");
const order_model_1 = require("../models/order.model");
const product_model_1 = require("../models/product.model");
const product_variant_model_1 = require("../models/product-variant.model");
let OrdersService = class OrdersService {
    orderModel;
    productModel;
    variantModel;
    orderCounterModel;
    constructor(orderModel, productModel, variantModel, orderCounterModel) {
        this.orderModel = orderModel;
        this.productModel = productModel;
        this.variantModel = variantModel;
        this.orderCounterModel = orderCounterModel;
    }
    async create(user, dto) {
        if (!dto.items?.length)
            throw new common_1.BadRequestException('items is required');
        const normalized = dto.items.map((it) => ({
            productId: it.productId,
            variantId: it.variantId,
            qty: it.qty,
        }));
        const uniqueProductIds = Array.from(new Set(normalized.map((x) => x.productId)));
        const products = await this.productModel.find({ _id: { $in: uniqueProductIds }, status: 'active' }).exec();
        if (products.length !== uniqueProductIds.length)
            throw new common_1.BadRequestException('Some products are missing or inactive');
        const productById = new Map();
        for (const p of products)
            productById.set(String(p._id), p);
        const variantIds = normalized.map((x) => x.variantId).filter(Boolean);
        const uniqueVariantIds = Array.from(new Set(variantIds));
        const variants = uniqueVariantIds.length
            ? await this.variantModel.find({ _id: { $in: uniqueVariantIds }, status: 'active' }).exec()
            : [];
        if (variants.length !== uniqueVariantIds.length)
            throw new common_1.BadRequestException('Some variants are missing or inactive');
        const variantById = new Map();
        for (const v of variants)
            variantById.set(String(v._id), v);
        const items = normalized.map((it) => {
            const p = productById.get(it.productId);
            if (!p)
                throw new common_1.BadRequestException('Invalid product');
            if (it.variantId) {
                const v = variantById.get(it.variantId);
                if (!v)
                    throw new common_1.BadRequestException('Invalid variant');
                if (String(v.productId) !== String(p._id))
                    throw new common_1.BadRequestException('Variant does not belong to product');
                const lineTotal = v.price * it.qty;
                return {
                    productId: p._id,
                    name: p.name,
                    slug: p.slug,
                    unitPrice: v.price,
                    qty: it.qty,
                    lineTotal,
                    variantId: v._id,
                    variantTitle: v.title,
                    skuCode: v.skuCode,
                    variantOptions: v.options,
                };
            }
            const lineTotal = p.price * it.qty;
            return {
                productId: p._id,
                name: p.name,
                slug: p.slug,
                unitPrice: p.price,
                qty: it.qty,
                lineTotal,
            };
        });
        const reservedUntil = new Date(Date.now() + 15 * 60 * 1000);
        for (let i = 0; i < items.length; i++) {
            const it = items[i];
            const updated = it.variantId
                ? await this.variantModel
                    .updateOne({
                    _id: it.variantId,
                    $expr: { $gte: [{ $subtract: ['$stock', '$reserved'] }, it.qty] },
                }, { $inc: { reserved: it.qty } })
                    .exec()
                : await this.productModel
                    .updateOne({
                    _id: it.productId,
                    $expr: { $gte: [{ $subtract: ['$stock', '$reserved'] }, it.qty] },
                }, { $inc: { reserved: it.qty } })
                    .exec();
            if (updated.modifiedCount !== 1) {
                for (let j = 0; j < i; j++) {
                    const prev = items[j];
                    if (prev.variantId) {
                        await this.variantModel
                            .updateOne({ _id: prev.variantId }, { $inc: { reserved: -prev.qty } })
                            .exec();
                    }
                    else {
                        await this.productModel
                            .updateOne({ _id: prev.productId }, { $inc: { reserved: -prev.qty } })
                            .exec();
                    }
                }
                throw new common_1.BadRequestException(`Out of stock: ${it.slug}`);
            }
        }
        const subtotal = items.reduce((sum, it) => sum + it.lineTotal, 0);
        const shippingFee = 0;
        const total = subtotal + shippingFee;
        const orderCode = await this.nextOrderCode();
        const userObjectId = mongoose_2.Types.ObjectId.isValid(user.id)
            ? new mongoose_2.Types.ObjectId(user.id)
            : user.id;
        return this.orderModel.create({
            userId: userObjectId,
            orderCode,
            items,
            receiverName: dto.receiverName?.trim(),
            receiverPhone: dto.phone?.trim(),
            receiverEmail: dto.email?.trim(),
            shippingAddress: dto.shippingAddress?.trim(),
            shippingMethod: dto.shippingMethod?.trim(),
            reservedUntil,
            subtotal,
            shippingFee,
            total,
            status: 'pending_payment',
            payment: {
                provider: 'vnpay',
                providerTxnRef: orderCode,
            },
        });
    }
    async getAdmin(admin, orderRef) {
        if (admin.role !== 'admin')
            throw new common_1.ForbiddenException('Forbidden');
        const order = mongoose_2.Types.ObjectId.isValid(orderRef)
            ? await this.orderModel.findById(orderRef).exec()
            : await this.orderModel.findOne({ orderCode: orderRef }).exec();
        if (!order)
            throw new common_1.NotFoundException('Order not found');
        return order;
    }
    async listAdmin(admin, query) {
        if (admin.role !== 'admin')
            throw new common_1.ForbiddenException('Forbidden');
        const page = query.page ?? 1;
        const limit = Math.min(query.limit ?? 20, 50);
        const skip = (page - 1) * limit;
        const match = {};
        if (query.status)
            match.status = query.status;
        const pipeline = [
            { $match: match },
            { $sort: { createdAt: -1 } },
            {
                $facet: {
                    items: [{ $skip: skip }, { $limit: limit }],
                    total: [{ $count: 'count' }],
                },
            },
        ];
        const res = await this.orderModel.aggregate(pipeline).exec();
        const items = (res?.[0]?.items ?? []);
        const total = Number(res?.[0]?.total?.[0]?.count ?? 0);
        return {
            items,
            meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
        };
    }
    async adminUpdateStatus(admin, orderRef, input) {
        if (admin.role !== 'admin')
            throw new common_1.ForbiddenException('Forbidden');
        const order = mongoose_2.Types.ObjectId.isValid(orderRef)
            ? await this.orderModel.findById(orderRef).exec()
            : await this.orderModel.findOne({ orderCode: orderRef }).exec();
        if (!order)
            throw new common_1.NotFoundException('Order not found');
        assertAllowedTransition(order.status, input.status);
        const patch = { status: input.status };
        if (input.trackingCode !== undefined)
            patch.trackingCode = input.trackingCode?.trim();
        const updated = await this.orderModel
            .findByIdAndUpdate(order._id, { $set: patch }, { returnDocument: 'after' })
            .exec();
        if (!updated)
            throw new common_1.NotFoundException('Order not found');
        return updated;
    }
    async getMine(user, orderId) {
        const order = mongoose_2.Types.ObjectId.isValid(orderId)
            ? await this.orderModel.findById(orderId).exec()
            : await this.orderModel.findOne({ orderCode: orderId }).exec();
        if (!order)
            throw new common_1.NotFoundException('Order not found');
        if (String(order.userId) !== user.id)
            throw new common_1.ForbiddenException('Forbidden');
        return order;
    }
    async listMine(user, query) {
        const page = query.page ?? 1;
        const limit = Math.min(query.limit ?? 20, 50);
        const skip = (page - 1) * limit;
        const userId = mongoose_2.Types.ObjectId.isValid(user.id)
            ? new mongoose_2.Types.ObjectId(user.id)
            : user.id;
        const match = { userId };
        if (query.status)
            match.status = query.status;
        const pipeline = [
            { $match: match },
            { $sort: { createdAt: -1 } },
            {
                $facet: {
                    items: [{ $skip: skip }, { $limit: limit }],
                    total: [{ $count: 'count' }],
                },
            },
        ];
        const res = await this.orderModel.aggregate(pipeline).exec();
        const items = (res?.[0]?.items ?? []);
        const total = Number(res?.[0]?.total?.[0]?.count ?? 0);
        return {
            items,
            meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
        };
    }
    async nextOrderCode() {
        const day = formatDayKey(new Date());
        const key = `order:${day}`;
        const counter = await this.orderCounterModel
            .findOneAndUpdate({ key }, { $inc: { seq: 1 } }, { upsert: true, returnDocument: 'after' })
            .exec();
        if (!counter)
            throw new Error('Failed to allocate order counter');
        const seqStr = String(counter.seq).padStart(6, '0');
        return `OD${day}-${seqStr}`;
    }
};
exports.OrdersService = OrdersService;
exports.OrdersService = OrdersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(order_model_1.OrderModelName)),
    __param(1, (0, mongoose_1.InjectModel)(product_model_1.ProductModelName)),
    __param(2, (0, mongoose_1.InjectModel)(product_variant_model_1.ProductVariantModelName)),
    __param(3, (0, mongoose_1.InjectModel)(order_counter_model_1.OrderCounterModelName)),
    __metadata("design:paramtypes", [Function, Function, Function, Function])
], OrdersService);
function assertAllowedTransition(from, to) {
    if (from === to)
        return;
    const allowed = {
        pending_payment: ['paid', 'cancelled', 'cancelled_expired'],
        paid: ['processing', 'cancelled', 'refunded'],
        processing: ['shipped', 'cancelled', 'refunded'],
        shipped: ['delivered', 'refunded'],
        delivered: ['refunded'],
        cancelled: [],
        cancelled_expired: [],
        refunded: [],
    };
    const next = allowed[from] ?? [];
    if (!next.includes(to)) {
        throw new common_1.BadRequestException(`Invalid status transition: ${from} -> ${to}`);
    }
}
function formatDayKey(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}${m}${day}`;
}
//# sourceMappingURL=orders.service.js.map