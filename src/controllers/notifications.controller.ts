import { Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { CurrentUser } from '../decorators/user.decorator';
import type { JwtUser } from '../types/auth';
import { QueryNotificationsDto } from '../dto/notifications/query-notifications.dto';
import { NotificationsService } from '../services/notifications.service';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  list(@CurrentUser() user: JwtUser, @Query() query: QueryNotificationsDto) {
    return this.notificationsService.list(user.id, query);
  }

  @Post(':id/read')
  @UseGuards(JwtAuthGuard)
  read(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    return this.notificationsService.markRead(user.id, id);
  }

  @Post('read-all')
  @UseGuards(JwtAuthGuard)
  readAll(@CurrentUser() user: JwtUser) {
    return this.notificationsService.markAllRead(user.id);
  }
}
