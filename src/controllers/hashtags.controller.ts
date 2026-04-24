import { Controller, Get, Param, Query } from '@nestjs/common';
import { HashtagsService } from '../services/hashtags.service';
import { QueryHashtagPostsDto } from '../dto/hashtags/query-hashtag-posts.dto';
import { TrendingHashtagsDto } from '../dto/hashtags/trending-hashtags.dto';

@Controller('hashtags')
export class HashtagsController {
  constructor(private readonly hashtagsService: HashtagsService) {}

  @Get(':tag/posts')
  listPosts(@Param('tag') tag: string, @Query() query: QueryHashtagPostsDto) {
    return this.hashtagsService.listPostsByTag(tag, query);
  }

  @Get('trending')
  trending(@Query() query: TrendingHashtagsDto) {
    return this.hashtagsService.trending(query.window);
  }
}

