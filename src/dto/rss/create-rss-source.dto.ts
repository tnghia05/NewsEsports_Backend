import { IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';

export class CreateRssSourceDto {
  @IsUrl({ require_tld: false })
  url!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;
}
