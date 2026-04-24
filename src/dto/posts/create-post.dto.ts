import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreatePostDto {
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  title!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(50_000)
  content!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  thumbnailUrl?: string;

  @IsString()
  @MinLength(2)
  @MaxLength(40)
  game!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  tournament?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(30)
  tags?: string[];

  @IsOptional()
  @IsEnum(['draft', 'published'] as const)
  status: 'draft' | 'published' = 'draft';
}
