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
var PaymentsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentsService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const mongoose_1 = require("@nestjs/mongoose");
const vnpay_1 = require("vnpay");
const mongoose_2 = require("mongoose");
const order_model_1 = require("../models/order.model");
const payment_model_1 = require("../models/payment.model");
const product_model_1 = require("../models/product.model");
const product_variant_model_1 = require("../models/product-variant.model");
let PaymentsService = PaymentsService_1 = class PaymentsService {
    config;
    orderModel;
    paymentModel;
    productModel;
    variantModel;
    logger = new common_1.Logger(PaymentsService_1.name);
    vnpay;
    defaultReturnUrl;
    constructor(config, orderModel, paymentModel, productModel, variantModel) {
        this.config = config;
        this.orderModel = orderModel;
        this.paymentModel = paymentModel;
        this.productModel = productModel;
        this.variantModel = variantModel;
        const tmnCode = this.config.get('VNPAY_TMN_CODE', { infer: true });
        const secureSecret = this.config.get('VNPAY_SECURE_SECRET', {
            infer: true,
        });
        const testMode = (this.config.get('VNPAY_TEST_MODE', { infer: true }) ??
            'true') === 'true';
        const vnpayHost = this.config.get('VNPAY_HOST', { infer: true }) ?? undefined;
        const enableLog = (this.config.get('VNPAY_ENABLE_LOG', { infer: true }) ??
            'false') === 'true';
        this.defaultReturnUrl =
            this.config.get('VNPAY_RETURN_URL', { infer: true }) ?? undefined;
        if (!tmnCode || !secureSecret) {
            this.logger.warn('VNPay disabled: VNPAY_TMN_CODE/VNPAY_SECURE_SECRET missing');
            return;
        }
        this.vnpay = new vnpay_1.VNPay({
            tmnCode,
            secureSecret,
            vnpayHost: vnpayHost ?? 'https://sandbox.vnpayment.vn',
            testMode,
            enableLog,
            loggerFn: enableLog ? undefined : vnpay_1.ignoreLogger,
        });
        this.logger.log(`VNPay enabled testMode=${testMode} host=${vnpayHost ?? 'sandbox'}`);
    }
    async createVNPayPaymentUrl(user, orderRef, dto, clientIp) {
        if (!this.vnpay)
            throw new common_1.BadRequestException('VNPay is not configured');
        const order = mongoose_2.Types.ObjectId.isValid(orderRef)
            ? await this.orderModel
                .findOne({
                $or: [{ orderCode: orderRef }, { _id: new mongoose_2.Types.ObjectId(orderRef) }],
            })
                .exec()
            : await this.orderModel.findOne({ orderCode: orderRef }).exec();
        if (!order)
            throw new common_1.NotFoundException('Order not found');
        if (String(order.userId) !== user.id)
            throw new common_1.ForbiddenException('Forbidden');
        if (order.status !== 'pending_payment')
            throw new common_1.BadRequestException(`Order status is ${order.status}`);
        if (order.reservedUntil && order.reservedUntil.getTime() < Date.now()) {
            throw new common_1.BadRequestException('Order reservation expired');
        }
        const returnUrl = dto.returnUrl ?? this.defaultReturnUrl;
        if (!returnUrl)
            throw new common_1.BadRequestException('returnUrl is required');
        const locale = (dto.locale ?? 'vn') === 'en' ? vnpay_1.VnpLocale.EN : vnpay_1.VnpLocale.VN;
        const paymentUrl = this.vnpay.buildPaymentUrl({
            vnp_Amount: order.total,
            vnp_IpAddr: clientIp,
            vnp_TxnRef: order.orderCode,
            vnp_OrderInfo: safeOrderInfo(`Thanh toan don hang ${order.orderCode}`),
            vnp_OrderType: vnpay_1.ProductCode.Other,
            vnp_ReturnUrl: returnUrl,
            vnp_Locale: locale,
            ...(dto.bankCode ? { vnp_BankCode: dto.bankCode } : {}),
        });
        const payment = await this.upsertPayment({
            orderId: order._id,
            provider: 'vnpay',
            txnRef: order.orderCode,
            amount: order.total,
            paymentUrl,
            status: 'redirected',
        });
        await this.orderModel
            .updateOne({ _id: order._id }, {
            $set: {
                'payment.provider': 'vnpay',
                'payment.providerTxnRef': order.orderCode,
            },
        })
            .exec();
        return {
            orderId: String(order._id),
            orderCode: order.orderCode,
            paymentUrl,
            paymentId: String(payment._id),
        };
    }
    async verifyVNPayReturn(query) {
        if (!this.vnpay)
            throw new common_1.BadRequestException('VNPay is not configured');
        let verify;
        try {
            verify = this.vnpay.verifyReturnUrl(query);
        }
        catch {
            throw new common_1.BadRequestException('Invalid VNPay return query');
        }
        await this.paymentModel
            .updateOne({ provider: 'vnpay', txnRef: verify.vnp_TxnRef }, { $set: { vnpVerify: verify } })
            .exec();
        return verify;
    }
    async handleVNPayIpn(query) {
        if (!this.vnpay)
            throw new common_1.BadRequestException('VNPay is not configured');
        let verify;
        try {
            verify = this.vnpay.verifyIpnCall(query);
        }
        catch (e) {
            this.logger.warn(`ipn invalid query: ${String(e?.message ?? e)}`);
            return { RspCode: '99', Message: 'Invalid data' };
        }
        if (!verify.isVerified) {
            return { RspCode: '97', Message: 'Fail checksum' };
        }
        if (!verify.isSuccess) {
            await this.markPaymentResult(verify.vnp_TxnRef, 'failed', verify);
            return { RspCode: '00', Message: 'Confirm Success' };
        }
        const order = await this.orderModel
            .findOne({ orderCode: verify.vnp_TxnRef })
            .exec();
        if (!order)
            return { RspCode: '01', Message: 'Order not found' };
        if (Number(verify.vnp_Amount) !== Number(order.total)) {
            return { RspCode: '04', Message: 'Invalid amount' };
        }
        if (order.status === 'paid') {
            return { RspCode: '02', Message: 'Order already confirmed' };
        }
        const now = new Date();
        if (order.status !== 'pending_payment') {
            await this.markPaymentResult(order.orderCode, 'succeeded', verify);
            return { RspCode: '00', Message: 'Confirm Success' };
        }
        if (order.reservedUntil && order.reservedUntil.getTime() < now.getTime()) {
            await this.orderModel
                .updateOne({ _id: order._id, status: 'pending_payment' }, {
                $set: {
                    status: 'cancelled_expired',
                    'payment.provider': 'vnpay',
                    'payment.providerTxnRef': order.orderCode,
                    'payment.vnp_TxnRef': verify.vnp_TxnRef,
                    'payment.vnp_TransactionNo': verify.vnp_TransactionNo,
                    'payment.vnp_BankCode': verify.vnp_BankCode,
                    'payment.vnp_ResponseCode': verify.vnp_ResponseCode,
                    'payment.vnp_TransactionStatus': verify
                        .vnp_TransactionStatus,
                    'payment.vnp_PayDate': verify.vnp_PayDate,
                    'payment.paidAt': new Date().toISOString(),
                },
            })
                .exec();
            await this.markPaymentResult(order.orderCode, 'succeeded', verify);
            return { RspCode: '00', Message: 'Confirm Success' };
        }
        for (const it of order.items) {
            const qty = Number(it.qty ?? 0);
            if (!qty)
                continue;
            if (it.variantId) {
                const updated = await this.variantModel
                    .updateOne({ _id: it.variantId, reserved: { $gte: qty }, stock: { $gte: qty } }, { $inc: { reserved: -qty, stock: -qty } })
                    .exec();
                if (updated.modifiedCount !== 1) {
                    this.logger.error(`finalize failed variant=${String(it.variantId)} qty=${qty}`);
                    throw new common_1.BadRequestException('Failed to finalize stock');
                }
            }
            else {
                const updated = await this.productModel
                    .updateOne({ _id: it.productId, reserved: { $gte: qty }, stock: { $gte: qty } }, { $inc: { reserved: -qty, stock: -qty } })
                    .exec();
                if (updated.modifiedCount !== 1) {
                    this.logger.error(`finalize failed product=${String(it.productId)} qty=${qty}`);
                    throw new common_1.BadRequestException('Failed to finalize stock');
                }
            }
        }
        await this.orderModel
            .updateOne({ _id: order._id, status: 'pending_payment' }, {
            $set: {
                status: 'paid',
                'payment.provider': 'vnpay',
                'payment.providerTxnRef': order.orderCode,
                'payment.vnp_TxnRef': verify.vnp_TxnRef,
                'payment.vnp_TransactionNo': verify.vnp_TransactionNo,
                'payment.vnp_BankCode': verify.vnp_BankCode,
                'payment.vnp_ResponseCode': verify.vnp_ResponseCode,
                'payment.vnp_TransactionStatus': verify
                    .vnp_TransactionStatus,
                'payment.vnp_PayDate': verify.vnp_PayDate,
                'payment.paidAt': new Date().toISOString(),
            },
        })
            .exec();
        await this.markPaymentResult(order.orderCode, 'succeeded', verify);
        return { RspCode: '00', Message: 'Confirm Success' };
    }
    async upsertPayment(input) {
        const updated = await this.paymentModel
            .findOneAndUpdate({ provider: input.provider, txnRef: input.txnRef }, {
            $setOnInsert: {
                orderId: input.orderId,
                provider: input.provider,
                txnRef: input.txnRef,
            },
            $set: {
                amount: input.amount,
                paymentUrl: input.paymentUrl,
                status: input.status,
            },
        }, { upsert: true, returnDocument: 'after' })
            .exec();
        if (!updated)
            throw new Error('Failed to upsert payment');
        return updated;
    }
    async markPaymentResult(txnRef, status, verify) {
        await this.paymentModel
            .updateOne({ provider: 'vnpay', txnRef }, { $set: { status, vnpVerify: verify } })
            .exec();
    }
};
exports.PaymentsService = PaymentsService;
exports.PaymentsService = PaymentsService = PaymentsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, mongoose_1.InjectModel)(order_model_1.OrderModelName)),
    __param(2, (0, mongoose_1.InjectModel)(payment_model_1.PaymentModelName)),
    __param(3, (0, mongoose_1.InjectModel)(product_model_1.ProductModelName)),
    __param(4, (0, mongoose_1.InjectModel)(product_variant_model_1.ProductVariantModelName)),
    __metadata("design:paramtypes", [config_1.ConfigService, Function, Function, Function, Function])
], PaymentsService);
function safeOrderInfo(input) {
    return input
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9 _-]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}
//# sourceMappingURL=payments.service.js.map