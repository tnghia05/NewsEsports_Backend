import { Controller, Get, Param, Query } from '@nestjs/common';
import { KalstropService } from '../services/kalstrop.service';

const ALLOWED_SPORTS = ['lol', 'cs2', 'dota2', 'r6', 'kog'];
const ALLOWED_TYPES = ['live', 'upcoming', 'popular'];

@Controller('kalstrop')
export class KalstropController {
  constructor(private readonly kalstrop: KalstropService) {}

  @Get(':sport/:type')
  getFixtures(
    @Param('sport') sport: string,
    @Param('type') type: string,
  ) {
    const s = ALLOWED_SPORTS.includes(sport) ? sport : 'lol';
    const t = ALLOWED_TYPES.includes(type) ? (type as 'live' | 'upcoming' | 'popular') : 'upcoming';
    return this.kalstrop.getFixtures(s, t);
  }

  @Get('fixture/:id/details')
  getFixtureDetails(
    @Param('id') id: string,
    @Query('group') group?: string,
  ) {
    return this.kalstrop.getFixtureDetails(id, group);
  }

  @Get('fixture/ssr/groups')
  getFixtureSsr(
    @Query('sport') sport: string,
    @Query('category') category: string,
    @Query('tournament') tournament: string,
    @Query('fixture') fixture: string,
  ) {
    return this.kalstrop.getFixtureSsrGroups(sport, category, tournament, fixture);
  }
}
