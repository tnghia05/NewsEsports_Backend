import { Controller, Get, Param, Query } from '@nestjs/common';
import { KalstropService } from '../services/kalstrop.service';

const ALLOWED_SPORTS = ['lol', 'cs2', 'dota2', 'r6', 'kog', 'valorant'];
const ALLOWED_TYPES = ['live', 'upcoming', 'popular'];

@Controller('kalstrop')
export class KalstropController {
  constructor(private readonly kalstrop: KalstropService) {}

  @Get(':sport/:type')
  getFixtures(
    @Param('sport') sport: string,
    @Param('type') type: string,
    @Query('region') region?: string,
  ) {
    const s = ALLOWED_SPORTS.includes(sport) ? sport : 'lol';
    const t = ALLOWED_TYPES.includes(type) ? (type as 'live' | 'upcoming' | 'popular') : 'upcoming';
    return this.kalstrop.getFixtures(s, t, region?.toLowerCase().trim());
  }

  @Get(':sport/competitions')
  getCompetitions(@Param('sport') sport: string) {
    const categorySlug = `league-of-legends-international`; // LoL uses this category
    // For other sports add mappings as needed
    const slugMap: Record<string, string> = {
      lol: 'league-of-legends-international',
      cs2: 'counter-strike',
      dota2: 'dota-2',
      valorant: 'valorant',
    };
    return this.kalstrop.getCompetitions(slugMap[sport] ?? `${sport}-international`);
  }

  @Get('competition/:slug/fixtures')
  getCompetitionFixtures(@Param('slug') slug: string) {
    return this.kalstrop.getCompetitionFixtures(slug);
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
