import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { CurrentUser } from '../decorators/user.decorator';
import type { JwtUser } from '../types/auth';
import { NewsService } from '../services/news.service';
import { NewsImportWorkerService } from '../services/news-import-worker.service';
import { NewsCrawlWorkerService } from '../services/news-crawl-worker.service';
import { CreateNewsDto } from '../dto/news/create-news.dto';
import { UpdateNewsDto } from '../dto/news/update-news.dto';
import { QueryNewsDto } from '../dto/news/query-news.dto';
import { BulkDeleteNewsDto } from '../dto/news/bulk-delete-news.dto';

@Controller('news')
export class NewsController {
  constructor(
    private readonly newsService: NewsService,
    private readonly newsImportWorkerService: NewsImportWorkerService,
    private readonly newsCrawlWorkerService: NewsCrawlWorkerService,
  ) {}

  // Public
  @Get()
  listPublic(@Query() query: QueryNewsDto) {
    return this.newsService.listPublic(query);
  }

  @Get('slug/:slug')
  getPublicBySlug(@Param('slug') slug: string) {
    return this.newsService.getPublicBySlug(slug);
  }

  @Get(':id')
  getPublicById(@Param('id') id: string) {
    return this.newsService.getPublicById(id);
  }

  // Admin
  @Get('admin/list')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  listAdmin(@CurrentUser() admin: JwtUser, @Query() query: QueryNewsDto) {
    return this.newsService.listAdmin(admin, query);
  }

  @Post('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  create(@CurrentUser() admin: JwtUser, @Body() dto: CreateNewsDto) {
    return this.newsService.create(admin, dto);
  }

  @Patch('admin/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  update(
    @CurrentUser() admin: JwtUser,
    @Param('id') id: string,
    @Body() dto: UpdateNewsDto,
  ) {
    return this.newsService.update(admin, id, dto);
  }

  @Delete('admin/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  remove(@CurrentUser() admin: JwtUser, @Param('id') id: string) {
    return this.newsService.remove(admin, id);
  }

  @Post('admin/bulk-delete')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  bulkRemove(@CurrentUser() admin: JwtUser, @Body() dto: BulkDeleteNewsDto) {
    return this.newsService.removeMany(admin, dto.ids);
  }

  @Post('admin/import-rss')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  importRss() {
    return this.newsImportWorkerService.importNow();
  }

  @Post('admin/crawl-now')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  crawlNow() {
    return this.newsCrawlWorkerService.crawlNow();
  }
}
