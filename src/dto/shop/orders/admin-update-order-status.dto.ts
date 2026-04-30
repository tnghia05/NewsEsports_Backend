import { IsIn, IsOptional, IsString } from 'class-validator';

export class AdminUpdateOrderStatusDto {
  @IsIn([
    'pending_payment',
    'paid',
    'processing',
    'shipped',
    'delivered',
    'cancelled',
    'cancelled_expired',
    'refunded',
  ])
  status!:
    | 'pending_payment'
    | 'paid'
    | 'processing'
    | 'shipped'
    | 'delivered'
    | 'cancelled'
    | 'cancelled_expired'
    | 'refunded';

  @IsOptional()
  @IsString()
  trackingCode?: string;
}

