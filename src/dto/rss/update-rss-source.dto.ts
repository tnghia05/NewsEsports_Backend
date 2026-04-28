import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateRssSourceDto {
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;
}
