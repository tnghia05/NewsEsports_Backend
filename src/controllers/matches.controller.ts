import { Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { MatchesService } from '../services/matches.service';
import { MatchSyncWorkerService } from '../services/match-sync-worker.service';
import { QueryMatchesDto } from '../dto/matches/query-matches.dto';

@Controller('matches')
export class MatchesController {
  constructor(
    private readonly matchesService: MatchesService,
    private readonly matchSyncWorkerService: MatchSyncWorkerService,
  ) {}

  @Get()
  list(@Query() query: QueryMatchesDto) {
    return this.matchesService.list(query);
  }

  @Get('stats')
  stats() {
    return this.matchesService.getStats();
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.matchesService.getById(id);
  }

  @Post('admin/sync-now')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  syncNow() {
    return this.matchSyncWorkerService.syncNow();
  }
}
