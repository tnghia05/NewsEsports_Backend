import { IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';

export class CreateCrawlSourceDto {
  @IsUrl()
  @MaxLength(2000)
  url!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;
}

