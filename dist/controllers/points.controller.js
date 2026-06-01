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
exports.PointsController = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const jwt_auth_guard_1 = require("../guards/jwt-auth.guard");
const optional_jwt_auth_guard_1 = require("../guards/optional-jwt-auth.guard");
const roles_guard_1 = require("../guards/roles.guard");
const roles_decorator_1 = require("../decorators/roles.decorator");
const user_decorator_1 = require("../decorators/user.decorator");
const points_service_1 = require("../services/points.service");
const predictions_service_1 = require("../services/predictions.service");
const place_prediction_dto_1 = require("../dto/points/place-prediction.dto");
const settle_prediction_dto_1 = require("../dto/points/settle-prediction.dto");
const redeem_product_dto_1 = require("../dto/points/redeem-product.dto");
const product_model_1 = require("../models/product.model");
const user_model_1 = require("../models/user.model");
let PointsController = class PointsController {
    pointsService;
    predictionsService;
    productModel;
    userModel;
    constructor(pointsService, predictionsService, productModel, userModel) {
        this.pointsService = pointsService;
        this.predictionsService = predictionsService;
        this.productModel = productModel;
        this.userModel = userModel;
    }
    async getLeaderboard(limit) {
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
            displayName: u.displayName,
            avatarUrl: u.avatarUrl,
            points: u.points,
        }));
    }
    async getMe(user, limit, skip) {
        const balance = await this.pointsService.getBalance(user.id);
        const history = await this.pointsService.getHistory(user.id, limit ? Number(limit) : 20, skip ? Number(skip) : 0);
        return { balance, ...history };
    }
    checkin(user) {
        return this.pointsService.checkin(user.id);
    }
    listPredictions(user, limit, skip) {
        return this.predictionsService.listByUser(user.id, limit ? Number(limit) : 20, skip ? Number(skip) : 0);
    }
    getMyPrediction(user, matchId) {
        return this.predictionsService.getMyPredictionForMatch(user.id, matchId);
    }
    placePrediction(user, dto) {
        return this.predictionsService.place(user.id, dto.matchId, dto.teamIndex, dto.pointsBet, dto.oddsSnapshot);
    }
    settle(matchId, dto) {
        return this.predictionsService.settle(matchId, dto.winnerTeamIndex);
    }
    cancelMatch(matchId) {
        return this.predictionsService.cancelMatch(matchId);
    }
    getPendingSummary() {
        return this.predictionsService.getPendingMatchSummary();
    }
    listByMatchAdmin(matchId) {
        return this.predictionsService.listByMatchForAdmin(matchId);
    }
    async getStore(limit, skip) {
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
    async redeem(user, dto) {
        const product = await this.productModel
            .findById(dto.productId)
            .lean()
            .exec();
        if (!product)
            throw new common_1.NotFoundException('Sản phẩm không tồn tại');
        if (!product.pointsPrice || product.pointsPrice <= 0)
            throw new common_1.BadRequestException('Sản phẩm này không thể đổi bằng điểm');
        if ((product.stock - (product.reserved ?? 0)) <= 0)
            throw new common_1.BadRequestException('Sản phẩm đã hết hàng');
        await this.pointsService.deductPoints(user.id, product.pointsPrice, 'redeem_product', { productId: dto.productId, variantId: dto.variantId });
        return { success: true, productName: product.name, pointsSpent: product.pointsPrice };
    }
};
exports.PointsController = PointsController;
__decorate([
    (0, common_1.Get)('leaderboard'),
    __param(0, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PointsController.prototype, "getLeaderboard", null);
__decorate([
    (0, common_1.Get)('me'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('skip')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], PointsController.prototype, "getMe", null);
__decorate([
    (0, common_1.Post)('checkin'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], PointsController.prototype, "checkin", null);
__decorate([
    (0, common_1.Get)('predictions'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('skip')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], PointsController.prototype, "listPredictions", null);
__decorate([
    (0, common_1.Get)('predictions/match/:matchId'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('matchId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], PointsController.prototype, "getMyPrediction", null);
__decorate([
    (0, common_1.Post)('predictions'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, place_prediction_dto_1.PlacePredictionDto]),
    __metadata("design:returntype", void 0)
], PointsController.prototype, "placePrediction", null);
__decorate([
    (0, common_1.Post)('predictions/settle/:matchId'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    __param(0, (0, common_1.Param)('matchId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, settle_prediction_dto_1.SettlePredictionDto]),
    __metadata("design:returntype", void 0)
], PointsController.prototype, "settle", null);
__decorate([
    (0, common_1.Post)('predictions/cancel/:matchId'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    __param(0, (0, common_1.Param)('matchId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PointsController.prototype, "cancelMatch", null);
__decorate([
    (0, common_1.Get)('predictions/admin/pending'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], PointsController.prototype, "getPendingSummary", null);
__decorate([
    (0, common_1.Get)('predictions/admin/match/:matchId'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    __param(0, (0, common_1.Param)('matchId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PointsController.prototype, "listByMatchAdmin", null);
__decorate([
    (0, common_1.Get)('store'),
    (0, common_1.UseGuards)(optional_jwt_auth_guard_1.OptionalJwtAuthGuard),
    __param(0, (0, common_1.Query)('limit')),
    __param(1, (0, common_1.Query)('skip')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], PointsController.prototype, "getStore", null);
__decorate([
    (0, common_1.Post)('redeem'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, redeem_product_dto_1.RedeemProductDto]),
    __metadata("design:returntype", Promise)
], PointsController.prototype, "redeem", null);
exports.PointsController = PointsController = __decorate([
    (0, common_1.Controller)('points'),
    __param(2, (0, mongoose_1.InjectModel)(product_model_1.ProductModelName)),
    __param(3, (0, mongoose_1.InjectModel)(user_model_1.UserModelName)),
    __metadata("design:paramtypes", [points_service_1.PointsService,
        predictions_service_1.PredictionsService, Function, Function])
], PointsController);
//# sourceMappingURL=points.controller.js.map