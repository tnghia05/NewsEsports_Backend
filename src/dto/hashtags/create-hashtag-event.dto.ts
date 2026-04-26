import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateHashtagEventDto {
  @IsString()
  @MaxLength(100)
  tag!: string;

  @IsEnum(['view'] as const)
  action: 'view' = 'view';

  @IsOptional()
  @IsString()
  @MaxLength(200)
  sessionId?: string;
}

