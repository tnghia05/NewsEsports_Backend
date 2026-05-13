import { IsIn, IsNumber } from 'class-validator';

export class SettlePredictionDto {
  @IsNumber()
  @IsIn([0, 1])
  winnerTeamIndex!: number;
}
