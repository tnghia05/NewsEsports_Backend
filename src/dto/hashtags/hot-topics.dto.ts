import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';

export class HotTopicsDto {
  @IsOptional()
  @IsEnum(['3h', '24h', '7d'] as const)
  window: '3h' | '24h' | '7d' = '3h';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit = 10;
}

