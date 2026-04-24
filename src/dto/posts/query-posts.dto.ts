import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class QueryPostsDto {
  @IsOptional()
  @IsEnum(['latest', 'hot', 'following'] as const)
  tab: 'latest' | 'hot' | 'following' = 'latest';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;

  @IsOptional()
  @IsString()
  game?: string;

  @IsOptional()
  @IsString()
  tag?: string;
}
