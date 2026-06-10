import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class VariantOptionDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(40)
  k!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  v!: string;
}

export class CreateProductVariantDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  title!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  skuCode!: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VariantOptionDto)
  options?: VariantOptionDto[];

  @IsInt()
  @Min(0)
  price!: number;

  @IsInt()
  @Min(0)
  stock!: number;

  @IsOptional()
  @IsString()
  status?: 'active' | 'inactive';
}
