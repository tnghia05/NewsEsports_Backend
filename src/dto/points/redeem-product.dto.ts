import { IsOptional, IsString } from 'class-validator';

export class RedeemProductDto {
  @IsString()
  productId!: string;

  @IsString()
  @IsOptional()
  variantId?: string;
}
