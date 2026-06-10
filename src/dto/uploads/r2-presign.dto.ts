import {
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class R2PresignDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  fileName!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  contentType!: string;

  @IsOptional()
  @IsIn(['post', 'product', 'avatar', 'video', 'misc'])
  folder?: 'post' | 'product' | 'avatar' | 'video' | 'misc';
}
