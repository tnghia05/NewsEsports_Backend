import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  slug!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  imageUrls?: string[];

  @IsInt()
  @Min(0)
  price!: number;

  @IsInt()
  @Min(0)
  stock!: number;

  @IsOptional()
  @IsString()
  type?: 'physical' | 'digital' | 'ticket' | 'service';

  @IsOptional()
  @IsString()
  status?: 'active' | 'inactive';

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}
