import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { PaymentsService } from '../services/payments.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { CurrentUser } from '../decorators/user.decorator';
import type { JwtUser } from '../types/auth';
import { VNPayCreatePaymentUrlDto } from '../dto/shop/payments/vnpay-create-payment-url.dto';
import type { ReturnQueryFromVNPay } from 'vnpay/types';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('vnpay/orders/:orderId/url')
  @UseGuards(JwtAuthGuard)
  async createVNPayUrl(
    @CurrentUser() user: JwtUser,
    @Param('orderId') orderId: string,
    @Body() dto: VNPayCreatePaymentUrlDto,
    @Req() req: Request,
  ) {
    void user;
    const ip =
      (req.headers['x-forwarded-for'] as string | undefined)
        ?.split(',')[0]
        ?.trim() ||
      req.ip ||
      req.socket.remoteAddress ||
      '127.0.0.1';
    return this.paymentsService.createVNPayPaymentUrl(orderId, dto, ip);
  }

  // Return URL (UI only)
  @Get('vnpay/return')
  verifyReturn(@Query() query: ReturnQueryFromVNPay) {
    return this.paymentsService.verifyVNPayReturn(query);
  }

  // IPN endpoint - VNPay calls this from gateway (GET querystring)
  @Get('vnpay/ipn')
  ipn(@Query() query: ReturnQueryFromVNPay) {
    return this.paymentsService.handleVNPayIpn(query);
  }
}
