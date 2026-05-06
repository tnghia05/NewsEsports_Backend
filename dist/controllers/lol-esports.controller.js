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
exports.LoLEsportsController = void 0;
const common_1 = require("@nestjs/common");
const lol_esports_service_1 = require("../services/lol-esports.service");
let LoLEsportsController = class LoLEsportsController {
    lolesports;
    constructor(lolesports) {
        this.lolesports = lolesports;
    }
    getLive(hl) {
        return this.lolesports.getLive(hl ?? 'vi-VN');
    }
    getSchedule(hl, pageToken) {
        return this.lolesports.getSchedule(hl ?? 'vi-VN', pageToken);
    }
    getEventDetails(matchId, hl) {
        return this.lolesports.getEventDetails(matchId, hl ?? 'vi-VN');
    }
    getLiveStats(gameId, startingTime) {
        return this.lolesports.getLiveStats(gameId, startingTime);
    }
    getLiveStatsDetails(gameId, startingTime) {
        return this.lolesports.getLiveStatsDetails(gameId, startingTime);
    }
    getPostgameStats(gameId, firstFrameTime) {
        return this.lolesports.getPostgameStats(gameId, firstFrameTime);
    }
};
exports.LoLEsportsController = LoLEsportsController;
__decorate([
    (0, common_1.Get)('live'),
    __param(0, (0, common_1.Query)('hl')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], LoLEsportsController.prototype, "getLive", null);
__decorate([
    (0, common_1.Get)('schedule'),
    __param(0, (0, common_1.Query)('hl')),
    __param(1, (0, common_1.Query)('pageToken')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], LoLEsportsController.prototype, "getSchedule", null);
__decorate([
    (0, common_1.Get)('event/:matchId'),
    __param(0, (0, common_1.Param)('matchId')),
    __param(1, (0, common_1.Query)('hl')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], LoLEsportsController.prototype, "getEventDetails", null);
__decorate([
    (0, common_1.Get)('live-stats/:gameId'),
    __param(0, (0, common_1.Param)('gameId')),
    __param(1, (0, common_1.Query)('startingTime')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], LoLEsportsController.prototype, "getLiveStats", null);
__decorate([
    (0, common_1.Get)('live-stats/:gameId/details'),
    __param(0, (0, common_1.Param)('gameId')),
    __param(1, (0, common_1.Query)('startingTime')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], LoLEsportsController.prototype, "getLiveStatsDetails", null);
__decorate([
    (0, common_1.Get)('postgame/:gameId'),
    __param(0, (0, common_1.Param)('gameId')),
    __param(1, (0, common_1.Query)('firstFrameTime')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], LoLEsportsController.prototype, "getPostgameStats", null);
exports.LoLEsportsController = LoLEsportsController = __decorate([
    (0, common_1.Controller)('lol-esports'),
    __metadata("design:paramtypes", [lol_esports_service_1.LoLEsportsService])
], LoLEsportsController);
//# sourceMappingURL=lol-esports.controller.js.map