import { Controller, Get, Param, Query } from '@nestjs/common';
import { LoLEsportsService } from '../services/lol-esports.service';

@Controller('lol-esports')
export class LoLEsportsController {
  constructor(private readonly lolesports: LoLEsportsService) {}

  @Get('live')
  getLive(@Query('hl') hl?: string) {
    return this.lolesports.getLive(hl ?? 'vi-VN');
  }

  @Get('schedule')
  getSchedule(
    @Query('hl') hl?: string,
    @Query('pageToken') pageToken?: string,
  ) {
    return this.lolesports.getSchedule(hl ?? 'vi-VN', pageToken);
  }

  @Get('event/:matchId')
  getEventDetails(
    @Param('matchId') matchId: string,
    @Query('hl') hl?: string,
  ) {
    return this.lolesports.getEventDetails(matchId, hl ?? 'vi-VN');
  }

  @Get('live-stats/:gameId')
  getLiveStats(
    @Param('gameId') gameId: string,
    @Query('startingTime') startingTime?: string,
  ) {
    return this.lolesports.getLiveStats(gameId, startingTime);
  }

  @Get('live-stats/:gameId/details')
  getLiveStatsDetails(
    @Param('gameId') gameId: string,
    @Query('startingTime') startingTime?: string,
  ) {
    return this.lolesports.getLiveStatsDetails(gameId, startingTime);
  }

  @Get('postgame/:gameId')
  getPostgameStats(
    @Param('gameId') gameId: string,
    @Query('firstFrameTime') firstFrameTime?: string,
  ) {
    return this.lolesports.getPostgameStats(gameId, firstFrameTime);
  }

  @Get('timeline/:gameId')
  getGameTimeline(@Param('gameId') gameId: string) {
    return this.lolesports.getGameTimeline(gameId);
  }
}
