import { Controller, Get, Param, Query } from '@nestjs/common';
import { KalstropService } from '../services/kalstrop.service';

@Controller('kalstrop')
export class KalstropController {
  constructor(private readonly kalstrop: KalstropService) {}

  @Get('lol/live')
  getLolLive() {
    return this.kalstrop.getLolFixtures('live');
  }

  @Get('lol/upcoming')
  getLolUpcoming() {
    return this.kalstrop.getLolFixtures('upcoming');
  }

  @Get('lol/popular')
  getLolPopular() {
    return this.kalstrop.getLolFixtures('popular');
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
