import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class QueryUserPostsDto {
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
  @IsEnum(['published', 'draft', 'all'] as const)
  status?: 'published' | 'draft' | 'all';

  @IsOptional()
  @IsString()
  game?: string;

  @IsOptional()
  @IsString()
  tag?: string;
}
