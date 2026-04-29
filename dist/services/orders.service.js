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
let OrdersService = class OrdersService {
    orderModel;
    productModel;
    orderCounterModel;
    constructor(orderModel, productModel, orderCounterModel) {
        this.orderModel = orderModel;
        this.productModel = productModel;
        this.orderCounterModel = orderCounterModel;
    }
    async create(user, dto) {
        if (!dto.items?.length)
            throw new common_1.BadRequestException('items is required');
        const normalized = dto.items.map((it) => ({
            productId: it.productId,
            qty: it.qty,
        }));
        const uniqueProductIds = Array.from(new Set(normalized.map((x) => x.productId)));
        const products = await this.productModel
            .find({ _id: { $in: uniqueProductIds }, status: 'active' })
            .exec();
        if (products.length !== uniqueProductIds.length) {
            throw new common_1.BadRequestException('Some products are missing or inactive');
        }
        const byId = new Map();
        for (const p of products)
            byId.set(String(p._id), p);
        const items = normalized.map((it) => {
            const p = byId.get(it.productId);
            if (!p)
                throw new common_1.BadRequestException('Invalid product');
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
        for (const it of items) {
            const updated = await this.productModel
                .updateOne({ _id: it.productId, stock: { $gte: it.qty } }, { $inc: { stock: -it.qty } })
                .exec();
            if (updated.modifiedCount !== 1) {
                for (const prev of items) {
                    if (String(prev.productId) === String(it.productId))
                        break;
                    await this.productModel
                        .updateOne({ _id: prev.productId }, { $inc: { stock: prev.qty } })
                        .exec();
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
    __param(2, (0, mongoose_1.InjectModel)(order_counter_model_1.OrderCounterModelName)),
    __metadata("design:paramtypes", [Function, Function, Function])
], OrdersService);
function formatDayKey(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}${m}${day}`;
}
//# sourceMappingURL=orders.service.js.map