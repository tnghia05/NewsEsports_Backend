import { IsOptional, IsString } from 'class-validator';

export class VNPayCreatePaymentUrlDto {
  @IsOptional()
  @IsString()
  returnUrl?: string;

  @IsOptional()
  @IsString()
  locale?: 'vn' | 'en';

  @IsOptional()
  @IsString()
  bankCode?: string;
}
