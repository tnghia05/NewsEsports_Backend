import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../guards/optional-jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { CurrentUser } from '../decorators/user.decorator';
import type { JwtUser } from '../types/auth';
import { PointsService } from '../services/points.service';
import { PredictionsService } from '../services/predictions.service';
import { PlacePredictionDto } from '../dto/points/place-prediction.dto';
import { SettlePredictionDto } from '../dto/points/settle-prediction.dto';
import { RedeemProductDto } from '../dto/points/redeem-product.dto';
import { ProductModelName, type ProductDocument } from '../models/product.model';
import { UserModelName, type UserDocument } from '../models/user.model';

@Controller('points')
export class PointsController {
  constructor(
    private readonly pointsService: PointsService,
    private readonly predictionsService: PredictionsService,
    @InjectModel(ProductModelName)
    private readonly productModel: Model<ProductDocument>,
    @InjectModel(UserModelName)
    private readonly userModel: Model<UserDocument>,
  ) {}

  // ── Leaderboard (public) ──────────────────────────────────────────────────

  @Get('leaderboard')
  async getLeaderboard(@Query('limit') limit?: string) {
    const lim = Math.min(Number(limit) || 10, 50);
    const users = await this.userModel
      .find({ points: { $gt: 0 } })
      .sort({ points: -1 })
      .limit(lim)
      .select('displayName avatarUrl points')
      .lean()
      .exec();
    return users.map((u, i) => ({
      rank: i + 1,
      displayName: (u as any).displayName as string,
      avatarUrl: (u as any).avatarUrl as string | undefined,
      points: (u as any).points as number,
    }));
  }

  // ── Balance & History ─────────────────────────────────────────────────────

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(
    @CurrentUser() user: JwtUser,
    @Query('limit') limit?: string,
    @Query('skip') skip?: string,
  ) {
    const balance = await this.pointsService.getBalance(user.id);
    const history = await this.pointsService.getHistory(
      user.id,
      limit ? Number(limit) : 20,
      skip ? Number(skip) : 0,
    );
    return { balance, ...history };
  }

  // ── Daily Check-in ────────────────────────────────────────────────────────

  @Post('checkin')
  @UseGuards(JwtAuthGuard)
  checkin(@CurrentUser() user: JwtUser) {
    return this.pointsService.checkin(user.id);
  }

  // ── Predictions ───────────────────────────────────────────────────────────

  @Get('predictions')
  @UseGuards(JwtAuthGuard)
  listPredictions(
    @CurrentUser() user: JwtUser,
    @Query('limit') limit?: string,
    @Query('skip') skip?: string,
  ) {
    return this.predictionsService.listByUser(
      user.id,
      limit ? Number(limit) : 20,
      skip ? Number(skip) : 0,
    );
  }

  @Get('predictions/match/:matchId')
  @UseGuards(JwtAuthGuard)
  getMyPrediction(
    @CurrentUser() user: JwtUser,
    @Param('matchId') matchId: string,
  ) {
    return this.predictionsService.getMyPredictionForMatch(user.id, matchId);
  }

  @Post('predictions')
  @UseGuards(JwtAuthGuard)
  placePrediction(
    @CurrentUser() user: JwtUser,
    @Body() dto: PlacePredictionDto,
  ) {
    return this.predictionsService.place(
      user.id,
      dto.matchId,
      dto.teamIndex,
      dto.pointsBet,
      dto.oddsSnapshot,
    );
  }

  @Post('predictions/settle/:matchId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  settle(
    @Param('matchId') matchId: string,
    @Body() dto: SettlePredictionDto,
  ) {
    return this.predictionsService.settle(matchId, dto.winnerTeamIndex);
  }

  @Post('predictions/cancel/:matchId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  cancelMatch(@Param('matchId') matchId: string) {
    return this.predictionsService.cancelMatch(matchId);
  }

  @Get('predictions/admin/pending')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  getPendingSummary() {
    return this.predictionsService.getPendingMatchSummary();
  }

  @Get('predictions/admin/match/:matchId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  listByMatchAdmin(@Param('matchId') matchId: string) {
    return this.predictionsService.listByMatchForAdmin(matchId);
  }

  // ── Points Store ──────────────────────────────────────────────────────────

  @Get('store')
  @UseGuards(OptionalJwtAuthGuard)
  async getStore(
    @Query('limit') limit?: string,
    @Query('skip') skip?: string,
  ) {
    const lim = limit ? Number(limit) : 24;
    const sk = skip ? Number(skip) : 0;
    const [items, total] = await Promise.all([
      this.productModel
        .find({ pointsPrice: { $gt: 0 }, status: 'active' })
        .sort({ pointsPrice: 1 })
        .skip(sk)
        .limit(lim)
        .lean()
        .exec(),
      this.productModel.countDocuments({ pointsPrice: { $gt: 0 }, status: 'active' }),
    ]);
    return { items, total };
  }

  @Post('redeem')
  @UseGuards(JwtAuthGuard)
  async redeem(@CurrentUser() user: JwtUser, @Body() dto: RedeemProductDto) {
    const product = await this.productModel
      .findById(dto.productId)
      .lean()
      .exec();
    if (!product) throw new NotFoundException('Sản phẩm không tồn tại');
    if (!product.pointsPrice || product.pointsPrice <= 0)
      throw new BadRequestException('Sản phẩm này không thể đổi bằng điểm');
    if ((product.stock - (product.reserved ?? 0)) <= 0)
      throw new BadRequestException('Sản phẩm đã hết hàng');

    await this.pointsService.deductPoints(
      user.id,
      product.pointsPrice,
      'redeem_product',
      { productId: dto.productId, variantId: dto.variantId },
    );

    return { success: true, productName: product.name, pointsSpent: product.pointsPrice };
  }
}
