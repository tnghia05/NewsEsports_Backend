import { Type } from 'class-transformer';
import {
  IsArray,
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class CreateOrderItemDto {
  @IsString()
  @IsNotEmpty()
  productId!: string;

  @IsOptional()
  @IsString()
  variantId?: string;

  @IsInt()
  @Min(1)
  qty!: number;
}

export class CreateOrderDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items!: CreateOrderItemDto[];

  @IsOptional()
  @IsString()
  receiverName?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  shippingAddress?: string;

  @IsOptional()
  @IsString()
  shippingMethod?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  pointsDiscount?: number;
}
