import { IsIn, IsNumber, IsString, Min } from 'class-validator';

export class PlacePredictionDto {
  @IsString()
  matchId!: string;

  @IsNumber()
  @IsIn([0, 1])
  teamIndex!: number;

  @IsNumber()
  @Min(1)
  pointsBet!: number;

  @IsNumber()
  @Min(1)
  oddsSnapshot!: number;
}
