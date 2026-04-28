import type { Request } from 'express';
import { PaymentsService } from '../services/payments.service';
import type { JwtUser } from '../types/auth';
import { VNPayCreatePaymentUrlDto } from '../dto/shop/payments/vnpay-create-payment-url.dto';
import type { ReturnQueryFromVNPay } from 'vnpay/types';
export declare class PaymentsController {
    private readonly paymentsService;
    constructor(paymentsService: PaymentsService);
    createVNPayUrl(user: JwtUser, orderId: string, dto: VNPayCreatePaymentUrlDto, req: Request): Promise<{
        orderId: string;
        orderCode: string;
        paymentUrl: string;
        paymentId: string;
    }>;
    verifyReturn(query: ReturnQueryFromVNPay): Promise<import("vnpay/types", { with: { "resolution-mode": "import" } }).VerifyReturnUrl>;
    ipn(query: ReturnQueryFromVNPay): Promise<{
        RspCode: string;
        Message: string;
    }>;
}
