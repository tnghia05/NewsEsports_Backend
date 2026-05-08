import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { HashtagsService } from '../services/hashtags.service';
import { HotTopicsWorkerService } from '../services/hot-topics-worker.service';
import { QueryHashtagPostsDto } from '../dto/hashtags/query-hashtag-posts.dto';
import { TrendingHashtagsDto } from '../dto/hashtags/trending-hashtags.dto';
import { HotTopicsDto } from '../dto/hashtags/hot-topics.dto';
import { CreateHashtagEventDto } from '../dto/hashtags/create-hashtag-event.dto';
import { OptionalJwtAuthGuard } from '../guards/optional-jwt-auth.guard';
import { CurrentUser } from '../decorators/user.decorator';
import type { JwtUser } from '../types/auth';

@Controller('hashtags')
export class HashtagsController {
  constructor(
    private readonly hashtagsService: HashtagsService,
    private readonly hotTopicsWorker: HotTopicsWorkerService,
  ) {}

  @Get(':tag/posts')
  listPosts(@Param('tag') tag: string, @Query() query: QueryHashtagPostsDto) {
    return this.hashtagsService.listPostsByTag(tag, query);
  }

  @Get('trending')
  trending(@Query() query: TrendingHashtagsDto) {
    return this.hashtagsService.trending(query.window);
  }

  @Post('events')
  @UseGuards(OptionalJwtAuthGuard)
  createEvent(
    @CurrentUser() user: JwtUser | undefined,
    @Body() dto: CreateHashtagEventDto,
  ) {
    return this.hashtagsService.createEvent(user, dto);
  }

  @Get('hot-topics')
  hotTopics(@Query() query: HotTopicsDto) {
    return this.hashtagsService.hotTopics(query);
  }

  @Post('hot-topics/refresh')
  refreshHotTopics() {
    return this.hotTopicsWorker.triggerRecompute();
  }

  // Entity trending: top mentioned players/teams/tournaments with sentiment breakdown
  // GET /hashtags/entity-trends?window=24h&limit=10&type=PLAYER
  @Get('entity-trends')
  entityTrends(
    @Query('window') window?: string,
    @Query('limit') limit?: string,
    @Query('type') type?: string,
  ) {
    return this.hashtagsService.getEntityTrends({
      window: window ?? '24h',
      limit: limit ? Number(limit) : 10,
      type,
    });
  }
}
