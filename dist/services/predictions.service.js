"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PredictionsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const prediction_model_1 = require("../models/prediction.model");
const match_model_1 = require("../models/match.model");
const user_model_1 = require("../models/user.model");
const points_service_1 = require("./points.service");
let PredictionsService = class PredictionsService {
    predictionModel;
    matchModel;
    userModel;
    pointsService;
    constructor(predictionModel, matchModel, userModel, pointsService) {
        this.predictionModel = predictionModel;
        this.matchModel = matchModel;
        this.userModel = userModel;
        this.pointsService = pointsService;
    }
    async place(userId, matchId, teamIndex, pointsBet, oddsSnapshot) {
        if (pointsBet < 1)
            throw new common_1.BadRequestException('Cược tối thiểu 1 điểm');
        if (teamIndex !== 0 && teamIndex !== 1)
            throw new common_1.BadRequestException('teamIndex phải là 0 hoặc 1');
        const match = await this.matchModel.findById(matchId).lean().exec();
        if (!match)
            throw new common_1.NotFoundException('Trận đấu không tồn tại');
        if (match.status === 'finished')
            throw new common_1.BadRequestException('Trận đấu đã kết thúc');
        const team = match.teams[teamIndex];
        if (!team)
            throw new common_1.BadRequestException('Đội không hợp lệ');
        const existing = await this.predictionModel
            .findOne({ userId, matchId })
            .lean()
            .exec();
        if (existing)
            throw new common_1.ConflictException('Bạn đã dự đoán trận này rồi');
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
    async settle(matchId, winnerTeamIndex) {
        const predictions = await this.predictionModel
            .find({ matchId, status: 'pending' })
            .exec();
        const results = [];
        for (const pred of predictions) {
            const isWin = pred.teamIndex === winnerTeamIndex;
            const pointsWon = isWin
                ? Math.floor(pred.pointsBet * pred.oddsAtBet)
                : 0;
            pred.status = isWin ? 'won' : 'lost';
            pred.settledAt = new Date();
            if (isWin)
                pred.pointsWon = pointsWon;
            await pred.save();
            if (isWin) {
                await this.pointsService.addPoints(pred.userId, pointsWon, 'prediction_win', { matchId, predictionId: String(pred._id) });
            }
            results.push({ userId: pred.userId, status: pred.status, pointsWon: isWin ? pointsWon : undefined });
        }
        return { settled: results.length, results };
    }
    async cancelMatch(matchId) {
        const predictions = await this.predictionModel
            .find({ matchId, status: 'pending' })
            .exec();
        for (const pred of predictions) {
            pred.status = 'cancelled';
            pred.settledAt = new Date();
            await pred.save();
            await this.pointsService.addPoints(pred.userId, pred.pointsBet, 'prediction_bet', { matchId, refund: true });
        }
        return { refunded: predictions.length };
    }
    async listByUser(userId, limit = 20, skip = 0) {
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
    async listByMatch(matchId) {
        return this.predictionModel.find({ matchId }).lean().exec();
    }
    async listByMatchForAdmin(matchId) {
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
            displayName: userMap.get(String(p.userId))?.displayName ?? p.userId,
        }));
    }
    async getMyPredictionForMatch(userId, matchId) {
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
            .map((r) => { try {
            return new mongoose_2.Types.ObjectId(String(r._id));
        }
        catch {
            return null;
        } })
            .filter((id) => id !== null);
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
                matchName: m?.matchName ?? 'Unknown',
                teams: m?.teams ?? [],
                matchStatus: m?.status ?? 'unknown',
                count: r.count,
                totalPoints: r.totalPoints,
            };
        });
    }
};
exports.PredictionsService = PredictionsService;
exports.PredictionsService = PredictionsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(prediction_model_1.PredictionModelName)),
    __param(1, (0, mongoose_1.InjectModel)(match_model_1.MatchModelName)),
    __param(2, (0, mongoose_1.InjectModel)(user_model_1.UserModelName)),
    __metadata("design:paramtypes", [Function, Function, Function, points_service_1.PointsService])
], PredictionsService);
//# sourceMappingURL=predictions.service.js.map