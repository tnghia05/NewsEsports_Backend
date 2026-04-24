import { Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../guards/optional-jwt-auth.guard';
import { CurrentUser } from '../decorators/user.decorator';
import type { JwtUser } from '../types/auth';
import { FollowsService } from '../services/follows.service';
import { PostsService } from '../services/posts.service';
import { QueryUserPostsDto } from '../dto/users/query-user-posts.dto';
import { QueryFollowDto } from '../dto/users/query-follow.dto';

@Controller('users')
export class UsersController {
  constructor(
    private readonly followsService: FollowsService,
    private readonly postsService: PostsService,
  ) {}

  @Post(':id/follow')
  @UseGuards(JwtAuthGuard)
  toggleFollow(@CurrentUser() user: JwtUser, @Param('id') followeeId: string) {
    return this.followsService.toggleFollow(user.id, followeeId);
  }

  @Get(':id/posts')
  @UseGuards(OptionalJwtAuthGuard)
  async listUserPosts(
    @CurrentUser() viewer: JwtUser | undefined,
    @Param('id') userId: string,
    @Query() query: QueryUserPostsDto,
  ) {
    const data = await this.postsService.listByUser(viewer, userId, query);
    const following = viewer ? await this.followsService.isFollowing(viewer.id, userId) : false;
    return { ...data, following };
  }

  @Get(':id/followers')
  async followers(@Param('id') userId: string, @Query() query: QueryFollowDto) {
    return this.followsService.listFollowers(userId, query);
  }

  @Get(':id/following')
  async following(@Param('id') userId: string, @Query() query: QueryFollowDto) {
    return this.followsService.listFollowing(userId, query);
  }
}
