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
import { CreateCrawlSourceDto } from '../dto/crawl/create-crawl-source.dto';
import { UpdateCrawlSourceDto } from '../dto/crawl/update-crawl-source.dto';
import { CrawlSourcesService } from '../services/crawl-sources.service';

@Controller('admin/crawl-sources')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class CrawlSourcesController {
  constructor(private readonly crawlSourcesService: CrawlSourcesService) {}

  @Get()
  list(@CurrentUser() admin: JwtUser) {
    return this.crawlSourcesService.listAdmin(admin);
  }

  @Post()
  create(@CurrentUser() admin: JwtUser, @Body() dto: CreateCrawlSourceDto) {
    return this.crawlSourcesService.create(admin, dto);
  }

  @Patch(':id')
  update(
    @CurrentUser() admin: JwtUser,
    @Param('id') id: string,
    @Body() dto: UpdateCrawlSourceDto,
  ) {
    return this.crawlSourcesService.update(admin, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() admin: JwtUser, @Param('id') id: string) {
    return this.crawlSourcesService.remove(admin, id);
  }
}

