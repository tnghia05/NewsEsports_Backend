import { Controller, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { CurrentUser } from '../decorators/user.decorator';
import type { JwtUser } from '../types/auth';
import { FollowsService } from '../services/follows.service';

@Controller('users')
export class UsersController {
  constructor(private readonly followsService: FollowsService) {}

  @Post(':id/follow')
  @UseGuards(JwtAuthGuard)
  toggleFollow(@CurrentUser() user: JwtUser, @Param('id') followeeId: string) {
    return this.followsService.toggleFollow(user.id, followeeId);
  }
}
