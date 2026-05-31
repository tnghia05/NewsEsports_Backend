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
function guardToken(configured) {
    if (!configured)
        throw new common_1.ServiceUnavailableException('PANDASCORE_TOKEN not configured');
}
let PandaScoreController = class PandaScoreController {
    pandaScore;
    constructor(pandaScore) {
        this.pandaScore = pandaScore;
    }
    async getLeagues(videogame) {
        guardToken(this.pandaScore.isConfigured);
        return this.pandaScore.fetchLeagues(videogame);
    }
    async getRunningSeries(videogame) {
        guardToken(this.pandaScore.isConfigured);
        return this.pandaScore.fetchRunningSeries(videogame);
    }
    async getUpcomingSeries(videogame) {
        guardToken(this.pandaScore.isConfigured);
        return this.pandaScore.fetchUpcomingSeries(videogame);
    }
    async getPastSeries(videogame) {
        guardToken(this.pandaScore.isConfigured);
        return this.pandaScore.fetchPastSeries(videogame);
    }
    async getSerieMatches(slug, status) {
        guardToken(this.pandaScore.isConfigured);
        return this.pandaScore.fetchSerieMatches(slug, status);
    }
    async getSerieDetail(slug) {
        guardToken(this.pandaScore.isConfigured);
        const data = await this.pandaScore.fetchSerieDetail(slug);
        if (!data)
            throw new common_1.BadGatewayException('Serie not found');
        return data;
    }
    async getRunningTournaments(videogame) {
        guardToken(this.pandaScore.isConfigured);
        return this.pandaScore.fetchRunningTournaments(videogame);
    }
    async getTournamentStandings(id) {
        guardToken(this.pandaScore.isConfigured);
        return this.pandaScore.fetchTournamentStandings(id);
    }
    async getTournamentTeams(id) {
        guardToken(this.pandaScore.isConfigured);
        return this.pandaScore.fetchTournamentTeams(id);
    }
    async getMatchDetail(matchIdOrSlug) {
        guardToken(this.pandaScore.isConfigured);
        const data = await this.pandaScore.fetchMatchDetail(matchIdOrSlug);
        if (!data)
            throw new common_1.BadGatewayException('Failed to fetch match detail');
        return data;
    }
    async getMatchOpponents(matchIdOrSlug) {
        guardToken(this.pandaScore.isConfigured);
        const data = await this.pandaScore.fetchMatchOpponents(matchIdOrSlug);
        if (!data)
            throw new common_1.BadGatewayException('Failed to fetch match opponents');
        return data;
    }
    async getLoLGame(gameId) {
        guardToken(this.pandaScore.isConfigured);
        const data = await this.pandaScore.fetchLoLGame(gameId);
        if (!data)
            throw new common_1.BadGatewayException('Failed to fetch LoL game detail');
        return data;
    }
    async getGameDetail(gameSlug, gameId) {
        guardToken(this.pandaScore.isConfigured);
        const data = await this.pandaScore.fetchGameDetail(gameSlug, gameId);
        if (!data)
            throw new common_1.BadGatewayException('Failed to fetch game detail');
        return data;
    }
};
exports.PandaScoreController = PandaScoreController;
__decorate([
    (0, common_1.Get)('leagues'),
    __param(0, (0, common_1.Query)('videogame')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PandaScoreController.prototype, "getLeagues", null);
__decorate([
    (0, common_1.Get)('series/running'),
    __param(0, (0, common_1.Query)('videogame')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PandaScoreController.prototype, "getRunningSeries", null);
__decorate([
    (0, common_1.Get)('series/upcoming'),
    __param(0, (0, common_1.Query)('videogame')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PandaScoreController.prototype, "getUpcomingSeries", null);
__decorate([
    (0, common_1.Get)('series/past'),
    __param(0, (0, common_1.Query)('videogame')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PandaScoreController.prototype, "getPastSeries", null);
__decorate([
    (0, common_1.Get)('series/:slug/matches'),
    __param(0, (0, common_1.Param)('slug')),
    __param(1, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], PandaScoreController.prototype, "getSerieMatches", null);
__decorate([
    (0, common_1.Get)('series/:slug'),
    __param(0, (0, common_1.Param)('slug')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PandaScoreController.prototype, "getSerieDetail", null);
__decorate([
    (0, common_1.Get)('tournaments/running'),
    __param(0, (0, common_1.Query)('videogame')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PandaScoreController.prototype, "getRunningTournaments", null);
__decorate([
    (0, common_1.Get)('tournaments/:id/standings'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PandaScoreController.prototype, "getTournamentStandings", null);
__decorate([
    (0, common_1.Get)('tournaments/:id/teams'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PandaScoreController.prototype, "getTournamentTeams", null);
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