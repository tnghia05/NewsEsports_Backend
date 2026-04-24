import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class QueryCommentsDto {
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
  @IsEnum(['oldest', 'newest'] as const)
  sort: 'oldest' | 'newest' = 'oldest';

  // Optional: fetch replies for a parent, or only top-level when `topLevelOnly=true`
  @IsOptional()
  @IsString()
  parentId?: string;

  @IsOptional()
  @Type(() => Boolean)
  topLevelOnly = false;
}

