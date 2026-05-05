import {
  BadGatewayException,
  Controller,
  Get,
  Param,
  ServiceUnavailableException,
} from '@nestjs/common';
import { PandaScoreService } from '../infra/pandascore/pandascore.service';

@Controller('pandascore')
export class PandaScoreController {
  constructor(private readonly pandaScore: PandaScoreService) {}

  @Get('matches/:matchIdOrSlug')
  async getMatchDetail(@Param('matchIdOrSlug') matchIdOrSlug: string) {
    if (!this.pandaScore.isConfigured) {
      throw new ServiceUnavailableException('PANDASCORE_TOKEN not configured');
    }

    const data = await this.pandaScore.fetchMatchDetail(matchIdOrSlug);
    if (!data) throw new BadGatewayException('Failed to fetch match detail');
    return data;
  }

  @Get('matches/:matchIdOrSlug/opponents')
  async getMatchOpponents(@Param('matchIdOrSlug') matchIdOrSlug: string) {
    if (!this.pandaScore.isConfigured) {
      throw new ServiceUnavailableException('PANDASCORE_TOKEN not configured');
    }

    const data = await this.pandaScore.fetchMatchOpponents(matchIdOrSlug);
    if (!data) throw new BadGatewayException('Failed to fetch match opponents');
    return data;
  }

  @Get('lol/games/:gameId')
  async getLoLGame(@Param('gameId') gameId: string) {
    if (!this.pandaScore.isConfigured) {
      throw new ServiceUnavailableException('PANDASCORE_TOKEN not configured');
    }

    const data = await this.pandaScore.fetchLoLGame(gameId);
    if (!data) throw new BadGatewayException('Failed to fetch LoL game detail');
    return data;
  }

  @Get(':gameSlug/games/:gameId')
  async getGameDetail(
    @Param('gameSlug') gameSlug: string,
    @Param('gameId') gameId: string,
  ) {
    if (!this.pandaScore.isConfigured) {
      throw new ServiceUnavailableException('PANDASCORE_TOKEN not configured');
    }

    const data = await this.pandaScore.fetchGameDetail(gameSlug, gameId);
    if (!data) throw new BadGatewayException('Failed to fetch game detail');
    return data;
  }
}

