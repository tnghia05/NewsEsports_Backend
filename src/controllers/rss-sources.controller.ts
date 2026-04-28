import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Roles } from '../decorators/roles.decorator';
import { CurrentUser } from '../decorators/user.decorator';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import type { JwtUser } from '../types/auth';
import { CreateRssSourceDto } from '../dto/rss/create-rss-source.dto';
import { UpdateRssSourceDto } from '../dto/rss/update-rss-source.dto';
import { RssSourcesService } from '../services/rss-sources.service';

@Controller('admin/rss-sources')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class RssSourcesController {
  constructor(private readonly rssSourcesService: RssSourcesService) {}

  @Get()
  list(@CurrentUser() admin: JwtUser) {
    return this.rssSourcesService.listAdmin(admin);
  }

  @Post()
  create(@CurrentUser() admin: JwtUser, @Body() dto: CreateRssSourceDto) {
    return this.rssSourcesService.create(admin, dto);
  }

  @Patch(':id')
  update(
    @CurrentUser() admin: JwtUser,
    @Param('id') id: string,
    @Body() dto: UpdateRssSourceDto,
  ) {
    return this.rssSourcesService.update(admin, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() admin: JwtUser, @Param('id') id: string) {
    return this.rssSourcesService.remove(admin, id);
  }
}
