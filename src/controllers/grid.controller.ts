import { Controller, Get, Param, Query } from '@nestjs/common';
import { GridService } from '../services/grid.service';

@Controller('grid')
export class GridController {
  constructor(private readonly grid: GridService) {}

  @Get('schedule')
  getSchedule(
    @Query('titleIds') titleIds?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const ids = titleIds ? titleIds.split(',') : ['28', '2'];
    return this.grid.getSchedule(ids, from, to);
  }

  @Get('live')
  getLive(@Query('titleIds') titleIds?: string) {
    const ids = titleIds ? titleIds.split(',') : ['28', '2'];
    return this.grid.getLiveSeries(ids);
  }

  @Get('series/:id')
  getSeriesInfo(@Param('id') id: string) {
    return this.grid.getSeriesInfo(id);
  }

  @Get('series/:id/state')
  getSeriesState(@Param('id') id: string) {
    return this.grid.getSeriesState(id);
  }

  @Get('titles')
  getTitles() {
    return this.grid.getTitles();
  }
}
