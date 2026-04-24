import { IsEnum, IsOptional } from 'class-validator';

export class TrendingHashtagsDto {
  @IsOptional()
  @IsEnum(['24h', '7d'] as const)
  window: '24h' | '7d' = '24h';
}

