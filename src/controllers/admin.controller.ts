import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Query,
  Body,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { AiStatsService } from '../services/ai-stats.service';
import { AiService } from '../infra/ai/ai.service';
import { UsersService } from '../services/users.service';
import { NotificationsService } from '../services/notifications.service';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminController {
  constructor(
    private readonly aiStatsService: AiStatsService,
    private readonly aiService: AiService,
    private readonly usersService: UsersService,
    private readonly notificationsService: NotificationsService,
  ) {}

  // ── AI Stats endpoints (prefix: /admin/ai) ──────────────────────────────
  // Dashboard overview KPIs
  @Get('ai/overview')
  getOverview() {
    return this.aiStatsService.getDashboardOverview();
  }

  // #11 Per-day moderation breakdown
  @Get('ai/stats')
  getModerationStats(
    @Query('days', new DefaultValuePipe(7), ParseIntPipe) days: number,
  ) {
    return this.aiStatsService.getModerationStats(days);
  }

  // #11 Global sentiment4 distribution
  @Get('ai/sentiment')
  getSentiment4Distribution() {
    return this.aiStatsService.getSentiment4Distribution();
  }

  // #11 Toxic rate per game
  @Get('ai/toxic-by-game')
  getToxicRateByGame() {
    return this.aiStatsService.getToxicRateByGame();
  }

  // #9 Recent toxicity spike alerts
  @Get('ai/alerts')
  getAlerts(
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('unreadOnly') unreadOnly?: string,
  ) {
    return this.aiStatsService.getRecentAlerts({
      limit,
      unreadOnly: unreadOnly === 'true',
    });
  }

  // #9 Mark a single alert as read
  @Patch('ai/alerts/:id/read')
  markAlertRead(@Param('id') id: string) {
    return this.aiStatsService.markAlertRead(id);
  }

  // #13 List comments pending manual review
  @Get('ai/pending-review')
  getUnderReviewComments(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.aiStatsService.getUnderReviewComments({ page, limit });
  }

  // #13 Admin approves or rejects an under_review comment
  @Patch('ai/review/:commentId')
  reviewComment(
    @Param('commentId') commentId: string,
    @Body('decision') decision: 'approved' | 'rejected',
  ) {
    return this.aiStatsService.reviewComment(commentId, decision);
  }

  // Real-time PhoBERT testing endpoint for Admin Sandbox
  @Post('ai/test')
  async testModeration(@Body('text') text: string) {
    if (!text) {
      return { error: 'Text is required' };
    }
    return this.aiService.analyzeComment(text);
  }

  // ── User ban management ─────────────────────────────────────────────

  /** GET /admin/users/toxic — list users with toxic strikes */
  @Get('users/toxic')
  listToxicUsers(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('minStrikes', new DefaultValuePipe(1), ParseIntPipe)
    minStrikes: number,
  ) {
    return this.usersService.listToxicUsers({ page, limit, minStrikes });
  }

  /** POST /admin/users/:id/ban — ban a user temporarily or permanently */
  @Post('users/:id/ban')
  async banUser(
    @Param('id') userId: string,
    @Body('durationDays') durationDays: number,
    @Body('reason') reason: string,
  ) {
    if (!reason?.trim()) throw new BadRequestException('reason is required');
    const days = Number(durationDays);
    if (isNaN(days) || days < 0)
      throw new BadRequestException(
        'durationDays must be >= 0 (0 = permanent)',
      );

    const user = await this.usersService.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    await this.usersService.banUser(userId, { durationDays: days, reason });

    const isPermanent = days === 0;
    const banMsg = isPermanent
      ? `🚫 Tài khoản của bạn đã bị khóa vĩnh viễn do vi phạm chính sách cộng đồng. Lý do: ${reason}`
      : `🚫 Tài khoản của bạn đã bị khóa ${days} ngày do vi phạm chính sách cộng đồng. Lý do: ${reason}`;

    await this.notificationsService.create({
      userId,
      type: 'account_ban',
      message: banMsg,
    });

    return { ok: true, userId, durationDays: days, isPermanent, reason };
  }

  /** DELETE /admin/users/:id/ban — lift ban */
  @Patch('users/:id/unban')
  async unbanUser(@Param('id') userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    await this.usersService.unbanUser(userId);

    await this.notificationsService.create({
      userId,
      type: 'account_ban',
      message:
        '✅ Lệnh khóa tài khoản của bạn đã được gỡ bỏ. Vui lòng tuân thủ nội quy để tránh bị khóa trong tương lai.',
    });

    return { ok: true, userId, unbanned: true };
  }
}
