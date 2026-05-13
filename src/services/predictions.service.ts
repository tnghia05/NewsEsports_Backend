import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Types, type Model } from 'mongoose';
import {
  PredictionModelName,
  type PredictionDocument,
} from '../models/prediction.model';
import { MatchModelName, type MatchDocument } from '../models/match.model';
import { UserModelName, type UserDocument } from '../models/user.model';
import { PointsService } from './points.service';

@Injectable()
export class PredictionsService {
  constructor(
    @InjectModel(PredictionModelName)
    private readonly predictionModel: Model<PredictionDocument>,
    @InjectModel(MatchModelName)
    private readonly matchModel: Model<MatchDocument>,
    @InjectModel(UserModelName)
    private readonly userModel: Model<UserDocument>,
    private readonly pointsService: PointsService,
  ) {}

  async place(
    userId: string,
    matchId: string,
    teamIndex: number,
    pointsBet: number,
    oddsSnapshot: number,
  ) {
    if (pointsBet < 1) throw new BadRequestException('Cược tối thiểu 1 điểm');
    if (teamIndex !== 0 && teamIndex !== 1)
      throw new BadRequestException('teamIndex phải là 0 hoặc 1');

    const match = await this.matchModel.findById(matchId).lean().exec();
    if (!match) throw new NotFoundException('Trận đấu không tồn tại');
    if (match.status === 'finished')
      throw new BadRequestException('Trận đấu đã kết thúc');

    const team = match.teams[teamIndex];
    if (!team) throw new BadRequestException('Đội không hợp lệ');

    const existing = await this.predictionModel
      .findOne({ userId, matchId })
      .lean()
      .exec();
    if (existing) throw new ConflictException('Bạn đã dự đoán trận này rồi');

    await this.pointsService.deductPoints(userId, pointsBet, 'prediction_bet', {
      matchId,
      teamIndex,
    });

    const prediction = await this.predictionModel.create({
      userId,
      matchId,
      teamIndex,
      teamName: team.name,
      pointsBet,
      oddsAtBet: oddsSnapshot,
      status: 'pending',
    });

    return prediction;
  }

  async settle(matchId: string, winnerTeamIndex: number) {
    const predictions = await this.predictionModel
      .find({ matchId, status: 'pending' })
      .exec();

    const results: { userId: string; status: 'won' | 'lost'; pointsWon?: number }[] = [];

    for (const pred of predictions) {
      const isWin = pred.teamIndex === winnerTeamIndex;
      const pointsWon = isWin
        ? Math.floor(pred.pointsBet * pred.oddsAtBet)
        : 0;

      pred.status = isWin ? 'won' : 'lost';
      pred.settledAt = new Date();
      if (isWin) pred.pointsWon = pointsWon;
      await pred.save();

      if (isWin) {
        await this.pointsService.addPoints(
          pred.userId,
          pointsWon,
          'prediction_win',
          { matchId, predictionId: String(pred._id) },
        );
      }

      results.push({ userId: pred.userId, status: pred.status, pointsWon: isWin ? pointsWon : undefined });
    }

    return { settled: results.length, results };
  }

  async cancelMatch(matchId: string) {
    const predictions = await this.predictionModel
      .find({ matchId, status: 'pending' })
      .exec();

    for (const pred of predictions) {
      pred.status = 'cancelled';
      pred.settledAt = new Date();
      await pred.save();
      await this.pointsService.addPoints(
        pred.userId,
        pred.pointsBet,
        'prediction_bet',
        { matchId, refund: true },
      );
    }

    return { refunded: predictions.length };
  }

  async listByUser(userId: string, limit = 20, skip = 0) {
    const [items, total] = await Promise.all([
      this.predictionModel
        .find({ userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.predictionModel.countDocuments({ userId }),
    ]);
    return { items, total };
  }

  async listByMatch(matchId: string) {
    return this.predictionModel.find({ matchId }).lean().exec();
  }

  async listByMatchForAdmin(matchId: string) {
    const predictions = await this.predictionModel
      .find({ matchId })
      .sort({ createdAt: -1 })
      .lean()
      .exec();
    const userIds = [...new Set(predictions.map((p) => p.userId))];
    const users = await this.userModel
      .find({ _id: { $in: userIds } })
      .select('displayName avatarUrl')
      .lean()
      .exec();
    const userMap = new Map(users.map((u) => [String(u._id), u]));
    return predictions.map((p) => ({
      ...p,
      displayName: (userMap.get(String(p.userId)) as any)?.displayName ?? p.userId,
    }));
  }

  async getMyPredictionForMatch(userId: string, matchId: string) {
    return this.predictionModel.findOne({ userId, matchId }).lean().exec();
  }

  async getPendingMatchSummary() {
    const agg = await this.predictionModel.aggregate([
      { $match: { status: 'pending' } },
      {
        $group: {
          _id: '$matchId',
          count: { $sum: 1 },
          totalPoints: { $sum: '$pointsBet' },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 100 },
    ]);

    const matchIds = agg
      .map((r) => { try { return new Types.ObjectId(String(r._id)); } catch { return null; } })
      .filter((id): id is Types.ObjectId => id !== null);
    const matches = await this.matchModel
      .find({ _id: { $in: matchIds } })
      .select('matchName teams status')
      .lean()
      .exec();

    const matchMap = new Map(matches.map((m) => [String(m._id), m]));

    return agg.map((r) => {
      const m = matchMap.get(String(r._id));
      return {
        matchId: String(r._id),
        matchName: (m as any)?.matchName ?? 'Unknown',
        teams: (m as any)?.teams ?? [],
        matchStatus: (m as any)?.status ?? 'unknown',
        count: r.count as number,
        totalPoints: r.totalPoints as number,
      };
    });
  }
}
