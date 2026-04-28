import { ConfigService } from '@nestjs/config';
import type { Model } from 'mongoose';
import type { VerifyReturnUrl } from 'vnpay/types-only';
import type { ReturnQueryFromVNPay } from 'vnpay/types';
import { type OrderDocument } from '../models/order.model';
import { type PaymentDocument } from '../models/payment.model';
import type { VNPayCreatePaymentUrlDto } from '../dto/shop/payments/vnpay-create-payment-url.dto';
export declare class PaymentsService {
    private readonly config;
    private readonly orderModel;
    private readonly paymentModel;
    private readonly logger;
    private readonly vnpay?;
    private readonly defaultReturnUrl?;
    constructor(config: ConfigService, orderModel: Model<OrderDocument>, paymentModel: Model<PaymentDocument>);
    createVNPayPaymentUrl(orderId: string, dto: VNPayCreatePaymentUrlDto, clientIp: string): Promise<{
        orderId: string;
        orderCode: string;
        paymentUrl: string;
        paymentId: string;
    }>;
    verifyVNPayReturn(query: ReturnQueryFromVNPay): Promise<VerifyReturnUrl>;
    handleVNPayIpn(query: ReturnQueryFromVNPay): Promise<{
        RspCode: string;
        Message: string;
    }>;
    private upsertPayment;
    private markPaymentResult;
}
