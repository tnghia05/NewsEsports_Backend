import {
  BadGatewayException,
  Controller,
  Get,
  Param,
  Query,
  ServiceUnavailableException,
} from '@nestjs/common';
import { PandaScoreService } from '../infra/pandascore/pandascore.service';

/** Helper to build a 503 when token is missing */
function guardToken(configured: boolean) {
  if (!configured)
    throw new ServiceUnavailableException('PANDASCORE_TOKEN not configured');
}

@Controller('pandascore')
export class PandaScoreController {
  constructor(private readonly pandaScore: PandaScoreService) {}

  // ── Leagues ────────────────────────────────────────────────────────────────

  @Get('leagues')
  async getLeagues(@Query('videogame') videogame?: string) {
    guardToken(this.pandaScore.isConfigured);
    return this.pandaScore.fetchLeagues(videogame);
  }

  // ── Series ─────────────────────────────────────────────────────────────────

  @Get('series/running')
  async getRunningSeries(@Query('videogame') videogame?: string) {
    guardToken(this.pandaScore.isConfigured);
    return this.pandaScore.fetchRunningSeries(videogame);
  }

  @Get('series/upcoming')
  async getUpcomingSeries(@Query('videogame') videogame?: string) {
    guardToken(this.pandaScore.isConfigured);
    return this.pandaScore.fetchUpcomingSeries(videogame);
  }

  @Get('series/past')
  async getPastSeries(@Query('videogame') videogame?: string) {
    guardToken(this.pandaScore.isConfigured);
    return this.pandaScore.fetchPastSeries(videogame);
  }

  /** GET /pandascore/series/:slug/matches?status=running|upcoming|past */
  @Get('series/:slug/matches')
  async getSerieMatches(
    @Param('slug') slug: string,
    @Query('status') status?: 'running' | 'upcoming' | 'past',
  ) {
    guardToken(this.pandaScore.isConfigured);
    return this.pandaScore.fetchSerieMatches(slug, status);
  }

  @Get('series/:slug')
  async getSerieDetail(@Param('slug') slug: string) {
    guardToken(this.pandaScore.isConfigured);
    const data = await this.pandaScore.fetchSerieDetail(slug);
    if (!data) throw new BadGatewayException('Serie not found');
    return data;
  }

  // ── Tournaments ────────────────────────────────────────────────────────────

  @Get('tournaments/running')
  async getRunningTournaments(@Query('videogame') videogame?: string) {
    guardToken(this.pandaScore.isConfigured);
    return this.pandaScore.fetchRunningTournaments(videogame);
  }

  @Get('tournaments/:id/standings')
  async getTournamentStandings(@Param('id') id: string) {
    guardToken(this.pandaScore.isConfigured);
    return this.pandaScore.fetchTournamentStandings(id);
  }

  @Get('tournaments/:id/teams')
  async getTournamentTeams(@Param('id') id: string) {
    guardToken(this.pandaScore.isConfigured);
    return this.pandaScore.fetchTournamentTeams(id);
  }

  @Get('tournaments/:id/rosters')
  async getTournamentRosters(@Param('id') id: string) {
    guardToken(this.pandaScore.isConfigured);
    return this.pandaScore.fetchTournamentRosters(id);
  }

  // ── Match detail (existing) ────────────────────────────────────────────────

  @Get('matches/:matchIdOrSlug')
  async getMatchDetail(@Param('matchIdOrSlug') matchIdOrSlug: string) {
    guardToken(this.pandaScore.isConfigured);
    const data = await this.pandaScore.fetchMatchDetail(matchIdOrSlug);
    if (!data) throw new BadGatewayException('Failed to fetch match detail');
    return data;
  }

  @Get('matches/:matchIdOrSlug/opponents')
  async getMatchOpponents(@Param('matchIdOrSlug') matchIdOrSlug: string) {
    guardToken(this.pandaScore.isConfigured);
    const data = await this.pandaScore.fetchMatchOpponents(matchIdOrSlug);
    if (!data) throw new BadGatewayException('Failed to fetch match opponents');
    return data;
  }

  @Get('lol/games/:gameId')
  async getLoLGame(@Param('gameId') gameId: string) {
    guardToken(this.pandaScore.isConfigured);
    const data = await this.pandaScore.fetchLoLGame(gameId);
    if (!data) throw new BadGatewayException('Failed to fetch LoL game detail');
    return data;
  }

  @Get(':gameSlug/games/:gameId')
  async getGameDetail(
    @Param('gameSlug') gameSlug: string,
    @Param('gameId') gameId: string,
  ) {
    guardToken(this.pandaScore.isConfigured);
    const data = await this.pandaScore.fetchGameDetail(gameSlug, gameId);
    if (!data) throw new BadGatewayException('Failed to fetch game detail');
    return data;
  }
}
