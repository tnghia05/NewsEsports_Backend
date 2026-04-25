import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateSearchEventDto {
  @IsString()
  @MaxLength(200)
  q!: string;

  @IsIn(['search', 'click'])
  action!: 'search' | 'click';

  @IsOptional()
  @IsString()
  @MaxLength(200)
  sessionId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  targetId?: string;
}

