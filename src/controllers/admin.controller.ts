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
} from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { AiStatsService } from '../services/ai-stats.service';
import { AiService } from '../infra/ai/ai.service';

@Controller('admin/ai')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminController {
  constructor(
    private readonly aiStatsService: AiStatsService,
    private readonly aiService: AiService,
  ) {}

  // Dashboard overview KPIs
  @Get('overview')
  getOverview() {
    return this.aiStatsService.getDashboardOverview();
  }

  // #11 Per-day moderation breakdown
  @Get('stats')
  getModerationStats(
    @Query('days', new DefaultValuePipe(7), ParseIntPipe) days: number,
  ) {
    return this.aiStatsService.getModerationStats(days);
  }

  // #11 Global sentiment4 distribution
  @Get('sentiment')
  getSentiment4Distribution() {
    return this.aiStatsService.getSentiment4Distribution();
  }

  // #11 Toxic rate per game
  @Get('toxic-by-game')
  getToxicRateByGame() {
    return this.aiStatsService.getToxicRateByGame();
  }

  // #9 Recent toxicity spike alerts
  @Get('alerts')
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
  @Patch('alerts/:id/read')
  markAlertRead(@Param('id') id: string) {
    return this.aiStatsService.markAlertRead(id);
  }

  // #13 List comments pending manual review
  @Get('pending-review')
  getUnderReviewComments(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.aiStatsService.getUnderReviewComments({ page, limit });
  }

  // #13 Admin approves or rejects an under_review comment
  @Patch('review/:commentId')
  reviewComment(
    @Param('commentId') commentId: string,
    @Body('decision') decision: 'approved' | 'rejected',
  ) {
    return this.aiStatsService.reviewComment(commentId, decision);
  }

  // Real-time PhoBERT testing endpoint for Admin Sandbox
  @Post('test')
  async testModeration(@Body('text') text: string) {
    if (!text) {
      return { error: 'Text is required' };
    }
    return this.aiService.analyzeComment(text);
  }
}
