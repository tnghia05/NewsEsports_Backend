import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { CurrentUser } from '../decorators/user.decorator';
import type { JwtUser } from '../types/auth';
import { PostsService } from '../services/posts.service';

@Controller()
export class MeController {
  constructor(private readonly postsService: PostsService) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@CurrentUser() user: JwtUser) {
    return user;
  }

  @UseGuards(JwtAuthGuard)
  @Get('me/saved-posts')
  savedPosts(@CurrentUser() user: JwtUser) {
    // Alias for UI convenience
    return this.postsService.list(user, {
      tab: 'saved',
      page: 1,
      limit: 20,
    } as any);
  }
}
