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
exports.PandaScoreController = void 0;
const common_1 = require("@nestjs/common");
const pandascore_service_1 = require("../infra/pandascore/pandascore.service");
let PandaScoreController = class PandaScoreController {
    pandaScore;
    constructor(pandaScore) {
        this.pandaScore = pandaScore;
    }
    async getMatchDetail(matchIdOrSlug) {
        if (!this.pandaScore.isConfigured) {
            throw new common_1.ServiceUnavailableException('PANDASCORE_TOKEN not configured');
        }
        const data = await this.pandaScore.fetchMatchDetail(matchIdOrSlug);
        if (!data)
            throw new common_1.BadGatewayException('Failed to fetch match detail');
        return data;
    }
    async getMatchOpponents(matchIdOrSlug) {
        if (!this.pandaScore.isConfigured) {
            throw new common_1.ServiceUnavailableException('PANDASCORE_TOKEN not configured');
        }
        const data = await this.pandaScore.fetchMatchOpponents(matchIdOrSlug);
        if (!data)
            throw new common_1.BadGatewayException('Failed to fetch match opponents');
        return data;
    }
    async getLoLGame(gameId) {
        if (!this.pandaScore.isConfigured) {
            throw new common_1.ServiceUnavailableException('PANDASCORE_TOKEN not configured');
        }
        const data = await this.pandaScore.fetchLoLGame(gameId);
        if (!data)
            throw new common_1.BadGatewayException('Failed to fetch LoL game detail');
        return data;
    }
    async getGameDetail(gameSlug, gameId) {
        if (!this.pandaScore.isConfigured) {
            throw new common_1.ServiceUnavailableException('PANDASCORE_TOKEN not configured');
        }
        const data = await this.pandaScore.fetchGameDetail(gameSlug, gameId);
        if (!data)
            throw new common_1.BadGatewayException('Failed to fetch game detail');
        return data;
    }
};
exports.PandaScoreController = PandaScoreController;
__decorate([
    (0, common_1.Get)('matches/:matchIdOrSlug'),
    __param(0, (0, common_1.Param)('matchIdOrSlug')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PandaScoreController.prototype, "getMatchDetail", null);
__decorate([
    (0, common_1.Get)('matches/:matchIdOrSlug/opponents'),
    __param(0, (0, common_1.Param)('matchIdOrSlug')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PandaScoreController.prototype, "getMatchOpponents", null);
__decorate([
    (0, common_1.Get)('lol/games/:gameId'),
    __param(0, (0, common_1.Param)('gameId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PandaScoreController.prototype, "getLoLGame", null);
__decorate([
    (0, common_1.Get)(':gameSlug/games/:gameId'),
    __param(0, (0, common_1.Param)('gameSlug')),
    __param(1, (0, common_1.Param)('gameId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], PandaScoreController.prototype, "getGameDetail", null);
exports.PandaScoreController = PandaScoreController = __decorate([
    (0, common_1.Controller)('pandascore'),
    __metadata("design:paramtypes", [pandascore_service_1.PandaScoreService])
], PandaScoreController);
//# sourceMappingURL=pandascore.controller.js.map