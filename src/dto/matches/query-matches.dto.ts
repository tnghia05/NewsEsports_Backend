import { Transform } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class QueryMatchesDto {
  @IsOptional()
  @IsIn(['live', 'upcoming', 'finished', 'all'])
  tab?: 'live' | 'upcoming' | 'finished' | 'all' = 'all';

  @IsOptional()
  @IsString()
  game?: string;

  @IsOptional()
  @IsString()
  region?: string;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
