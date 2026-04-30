import { IsArray, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  imageUrls?: string[];

  @IsOptional()
  @IsInt()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  stock?: number;

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
