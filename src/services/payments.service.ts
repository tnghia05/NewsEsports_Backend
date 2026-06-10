import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { VNPay, ProductCode, VnpLocale, ignoreLogger } from 'vnpay';
import type { VerifyIpnCall, VerifyReturnUrl } from 'vnpay/types-only';
import type { ReturnQueryFromVNPay } from 'vnpay/types';
import { Types } from 'mongoose';
import { OrderModelName, type OrderDocument } from '../models/order.model';
import {
  PaymentModelName,
  type PaymentDocument,
  type PaymentStatus,
} from '../models/payment.model';
import type { VNPayCreatePaymentUrlDto } from '../dto/shop/payments/vnpay-create-payment-url.dto';
import type { JwtUser } from '../types/auth';
import { OrderReservationsService } from './order-reservations.service';
import {
  ProductModelName,
  type ProductDocument,
} from '../models/product.model';
import {
  ProductVariantModelName,
  type ProductVariantDocument,
} from '../models/product-variant.model';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly vnpay?: VNPay;
  private readonly defaultReturnUrl?: string;

  constructor(
    private readonly config: ConfigService,
    @InjectModel(OrderModelName)
    private readonly orderModel: Model<OrderDocument>,
    @InjectModel(PaymentModelName)
    private readonly paymentModel: Model<PaymentDocument>,
    @InjectModel(ProductModelName)
    private readonly productModel: Model<ProductDocument>,
    @InjectModel(ProductVariantModelName)
    private readonly variantModel: Model<ProductVariantDocument>,
    private readonly reservations: OrderReservationsService,
  ) {
    const tmnCode = this.config.get<string>('VNPAY_TMN_CODE', { infer: true });
    const secureSecret = this.config.get<string>('VNPAY_SECURE_SECRET', {
      infer: true,
    });
    const testMode =
      (this.config.get<string>('VNPAY_TEST_MODE', { infer: true }) ??
        'true') === 'true';
    const vnpayHost =
      this.config.get<string>('VNPAY_HOST', { infer: true }) ?? undefined;
    const enableLog =
      (this.config.get<string>('VNPAY_ENABLE_LOG', { infer: true }) ??
        'false') === 'true';
    this.defaultReturnUrl =
      this.config.get<string>('VNPAY_RETURN_URL', { infer: true }) ?? undefined;

    if (!tmnCode || !secureSecret) {
      this.logger.warn(
        'VNPay disabled: VNPAY_TMN_CODE/VNPAY_SECURE_SECRET missing',
      );
      return;
    }

    this.vnpay = new VNPay({
      tmnCode,
      secureSecret,
      vnpayHost: vnpayHost ?? 'https://sandbox.vnpayment.vn',
      testMode,
      enableLog,
      loggerFn: enableLog ? undefined : ignoreLogger,
    });

    this.logger.log(
      `VNPay enabled testMode=${testMode} host=${vnpayHost ?? 'sandbox'}`,
    );
  }

  async createVNPayPaymentUrl(
    user: JwtUser,
    orderRef: string,
    dto: VNPayCreatePaymentUrlDto,
    clientIp: string,
  ) {
    if (!this.vnpay) throw new BadRequestException('VNPay is not configured');

    // Production-facing identifier is orderCode. Keep _id backward-compatible.
    const order = Types.ObjectId.isValid(orderRef)
      ? await this.orderModel
          .findOne({
            $or: [
              { orderCode: orderRef },
              { _id: new Types.ObjectId(orderRef) },
            ],
          })
          .exec()
      : await this.orderModel.findOne({ orderCode: orderRef }).exec();
    if (!order) throw new NotFoundException('Order not found');
    if (String(order.userId) !== user.id)
      throw new ForbiddenException('Forbidden');
    if (order.status !== 'pending_payment')
      throw new BadRequestException(`Order status is ${order.status}`);
    if (order.reservedUntil && order.reservedUntil.getTime() < Date.now()) {
      throw new BadRequestException('Order reservation expired');
    }

    const returnUrl = dto.returnUrl ?? this.defaultReturnUrl;
    if (!returnUrl) throw new BadRequestException('returnUrl is required');

    const locale = (dto.locale ?? 'vn') === 'en' ? VnpLocale.EN : VnpLocale.VN;

    const paymentUrl = this.vnpay.buildPaymentUrl({
      vnp_Amount: order.total,
      vnp_IpAddr: clientIp,
      vnp_TxnRef: order.orderCode, // user chose orderCode as txnRef
      vnp_OrderInfo: safeOrderInfo(`Thanh toan don hang ${order.orderCode}`),
      vnp_OrderType: ProductCode.Other,
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
      .updateOne(
        { _id: order._id },
        {
          $set: {
            'payment.provider': 'vnpay',
            'payment.providerTxnRef': order.orderCode,
          },
        },
      )
      .exec();

    return {
      orderId: String(order._id),
      orderCode: order.orderCode,
      paymentUrl,
      paymentId: String(payment._id),
    };
  }

  async verifyVNPayReturn(query: ReturnQueryFromVNPay) {
    if (!this.vnpay) throw new BadRequestException('VNPay is not configured');
    let verify: VerifyReturnUrl;
    try {
      verify = this.vnpay.verifyReturnUrl(query);
    } catch {
      throw new BadRequestException('Invalid VNPay return query');
    }

    // Return URL is UI-only. Real business status should be handled by IPN.
    await this.paymentModel
      .updateOne(
        { provider: 'vnpay', txnRef: verify.vnp_TxnRef },
        { $set: { vnpVerify: verify } },
      )
      .exec();

    return verify;
  }

  async handleVNPayIpn(query: ReturnQueryFromVNPay) {
    if (!this.vnpay) throw new BadRequestException('VNPay is not configured');
    let verify: VerifyIpnCall;
    try {
      verify = this.vnpay.verifyIpnCall(query);
    } catch (e: any) {
      this.logger.warn(`ipn invalid query: ${String(e?.message ?? e)}`);
      return { RspCode: '99', Message: 'Invalid data' };
    }

    if (!verify.isVerified) {
      return { RspCode: '97', Message: 'Fail checksum' };
    }
    if (!verify.isSuccess) {
      // Payment failed/cancelled on gateway
      await this.markPaymentResult(verify.vnp_TxnRef, 'failed', verify);
      await this.reservations.releasePendingReservationByTxnRef(
        verify.vnp_TxnRef,
      );
      return { RspCode: '00', Message: 'Confirm Success' };
    }

    const order = await this.orderModel
      .findOne({ orderCode: verify.vnp_TxnRef })
      .exec();
    if (!order) return { RspCode: '01', Message: 'Order not found' };

    if (Number(verify.vnp_Amount) !== Number(order.total)) {
      return { RspCode: '04', Message: 'Invalid amount' };
    }

    if (order.status === 'paid') {
      return { RspCode: '02', Message: 'Order already confirmed' };
    }

    // If reservation expired/cancelled before payment confirmation, record payment but don't finalize stock.
    const now = new Date();
    if (order.status !== 'pending_payment') {
      await this.markPaymentResult(order.orderCode, 'succeeded', verify);
      return { RspCode: '00', Message: 'Confirm Success' };
    }
    if (order.reservedUntil && order.reservedUntil.getTime() < now.getTime()) {
      await this.orderModel
        .updateOne(
          { _id: order._id, status: 'pending_payment' },
          {
            $set: {
              status: 'cancelled_expired',
              'payment.provider': 'vnpay',
              'payment.providerTxnRef': order.orderCode,
              'payment.vnp_TxnRef': verify.vnp_TxnRef,
              'payment.vnp_TransactionNo': (verify as any).vnp_TransactionNo,
              'payment.vnp_BankCode': (verify as any).vnp_BankCode,
              'payment.vnp_ResponseCode': (verify as any).vnp_ResponseCode,
              'payment.vnp_TransactionStatus': (verify as any)
                .vnp_TransactionStatus,
              'payment.vnp_PayDate': (verify as any).vnp_PayDate,
              'payment.paidAt': new Date().toISOString(),
            },
          },
        )
        .exec();
      await this.reservations.releasePendingReservationIfNeeded(order._id);
      await this.markPaymentResult(order.orderCode, 'succeeded', verify);
      return { RspCode: '00', Message: 'Confirm Success' };
    }

    // Finalize reservation: reserved -= qty, stock -= qty
    for (const it of order.items as any[]) {
      const qty = Number(it.qty ?? 0);
      if (!qty) continue;
      if (it.variantId) {
        const updated = await this.variantModel
          .updateOne(
            {
              _id: it.variantId,
              reserved: { $gte: qty },
              stock: { $gte: qty },
            },
            { $inc: { reserved: -qty, stock: -qty } },
          )
          .exec();
        if (updated.modifiedCount !== 1) {
          this.logger.error(
            `finalize failed variant=${String(it.variantId)} qty=${qty}`,
          );
          throw new BadRequestException('Failed to finalize stock');
        }
      } else {
        const updated = await this.productModel
          .updateOne(
            {
              _id: it.productId,
              reserved: { $gte: qty },
              stock: { $gte: qty },
            },
            { $inc: { reserved: -qty, stock: -qty } },
          )
          .exec();
        if (updated.modifiedCount !== 1) {
          this.logger.error(
            `finalize failed product=${String(it.productId)} qty=${qty}`,
          );
          throw new BadRequestException('Failed to finalize stock');
        }
      }
    }

    await this.reservations.markInventoryFinalizedIfNeeded(order._id);

    await this.orderModel
      .updateOne(
        { _id: order._id, status: 'pending_payment' },
        {
          $set: {
            status: 'paid',
            reservationReleased: true,
            inventoryFinalized: true,
            'payment.provider': 'vnpay',
            'payment.providerTxnRef': order.orderCode,
            'payment.vnp_TxnRef': verify.vnp_TxnRef,
            'payment.vnp_TransactionNo': (verify as any).vnp_TransactionNo,
            'payment.vnp_BankCode': (verify as any).vnp_BankCode,
            'payment.vnp_ResponseCode': (verify as any).vnp_ResponseCode,
            'payment.vnp_TransactionStatus': (verify as any)
              .vnp_TransactionStatus,
            'payment.vnp_PayDate': (verify as any).vnp_PayDate,
            'payment.paidAt': new Date().toISOString(),
          },
        },
      )
      .exec();

    await this.markPaymentResult(order.orderCode, 'succeeded', verify);
    return { RspCode: '00', Message: 'Confirm Success' };
  }

  private async upsertPayment(input: {
    orderId: any;
    provider: 'vnpay';
    txnRef: string;
    amount: number;
    paymentUrl?: string;
    status: PaymentStatus;
  }) {
    const updated = await this.paymentModel
      .findOneAndUpdate(
        { provider: input.provider, txnRef: input.txnRef },
        {
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
        },
        { upsert: true, returnDocument: 'after' },
      )
      .exec();
    if (!updated) throw new Error('Failed to upsert payment');
    return updated;
  }

  private async markPaymentResult(
    txnRef: string,
    status: PaymentStatus,
    verify: any,
  ) {
    await this.paymentModel
      .updateOne(
        { provider: 'vnpay', txnRef },
        { $set: { status, vnpVerify: verify } },
      )
      .exec();
  }
}

function safeOrderInfo(input: string) {
  // VNPay requires: Vietnamese without accents + no special chars.
  // We'll do a conservative sanitize to ASCII letters/numbers/spaces/_-.
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9 _-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
