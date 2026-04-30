import { Transform } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Min } from 'class-validator';

export class QueryOrdersDto {
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  limit?: number = 20;

  @IsOptional()
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
  status?:
    | 'pending_payment'
    | 'paid'
    | 'processing'
    | 'shipped'
    | 'delivered'
    | 'cancelled'
    | 'cancelled_expired'
    | 'refunded';
}
