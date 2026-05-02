import { IsOptional, IsString, MaxLength } from 'class-validator';

export class AdminOrderNotesDto {
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  internalNotes?: string;
}
