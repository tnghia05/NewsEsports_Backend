import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { CurrentUser } from '../decorators/user.decorator';
import type { JwtUser } from '../types/auth';
import { PostsService } from '../services/posts.service';
import { UsersService } from '../services/users.service';

@Controller()
export class MeController {
  constructor(
    private readonly postsService: PostsService,
    private readonly usersService: UsersService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@CurrentUser() user: JwtUser) {
    return user;
  }

  @UseGuards(JwtAuthGuard)
  @Patch('users/me')
  async updateProfile(
    @CurrentUser() user: JwtUser,
    @Body() body: { displayName?: string; avatarUrl?: string },
  ) {
    const updated = await this.usersService.updateUser(user.id, body);
    return {
      id: String(updated?._id),
      email: updated?.email,
      displayName: updated?.displayName,
      avatarUrl: updated?.avatarUrl,
      role: updated?.role,
      points: updated?.points,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('users/me/stats')
  async getMeStats(@CurrentUser() user: JwtUser) {
    return this.postsService.getUserStats(user.id);
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
