import { Controller, Get, Query } from '@nestjs/common';
import { SearchService } from '../services/search.service';
import { SearchPostsDto } from '../dto/search/search-posts.dto';
import { SearchUsersDto } from '../dto/search/search-users.dto';

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
}

