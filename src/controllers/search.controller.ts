import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { SearchService } from '../services/search.service';
import { SearchPostsDto } from '../dto/search/search-posts.dto';
import { SearchUsersDto } from '../dto/search/search-users.dto';
import { CreateSearchEventDto } from '../dto/search/create-search-event.dto';
import { OptionalJwtAuthGuard } from '../guards/optional-jwt-auth.guard';
import { CurrentUser } from '../decorators/user.decorator';
import type { JwtUser } from '../types/auth';

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get('posts')
  searchPosts(@Query() query: SearchPostsDto) {
    return this.searchService.searchPosts(query);
  }

  @Get('users')
  searchUsers(@Query() query: SearchUsersDto) {
    return this.searchService.searchUsers(query);
  }

  @Post('events')
  @UseGuards(OptionalJwtAuthGuard)
  createEvent(
    @CurrentUser() user: JwtUser | undefined,
    @Body() dto: CreateSearchEventDto,
  ) {
    return this.searchService.createEvent(user, dto);
  }

  @Get('hot')
  hot(@Query('window') window?: string, @Query('limit') limit?: string) {
    return this.searchService.getHotKeywords({
      window: (window as any) ?? '24h',
      limit: limit ? Number(limit) : 10,
    });
  }

  @Get('trends')
  trends(@Query('window') window?: string, @Query('limit') limit?: string) {
    return this.searchService.getTrends({
      window: (window as any) ?? '24h',
      limit: limit ? Number(limit) : 10,
    });
  }

  @Get('suggest')
  suggest(@Query('q') q?: string, @Query('limit') limit?: string) {
    return this.searchService.suggest({
      q: q ?? '',
      limit: limit ? Number(limit) : 10,
    });
  }
}
