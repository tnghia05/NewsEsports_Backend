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
exports.AdminController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../guards/jwt-auth.guard");
const roles_guard_1 = require("../guards/roles.guard");
const roles_decorator_1 = require("../decorators/roles.decorator");
const ai_stats_service_1 = require("../services/ai-stats.service");
let AdminController = class AdminController {
    aiStatsService;
    constructor(aiStatsService) {
        this.aiStatsService = aiStatsService;
    }
    getOverview() {
        return this.aiStatsService.getDashboardOverview();
    }
    getModerationStats(days) {
        return this.aiStatsService.getModerationStats(days);
    }
    getSentiment4Distribution() {
        return this.aiStatsService.getSentiment4Distribution();
    }
    getToxicRateByGame() {
        return this.aiStatsService.getToxicRateByGame();
    }
    getAlerts(limit, unreadOnly) {
        return this.aiStatsService.getRecentAlerts({
            limit,
            unreadOnly: unreadOnly === 'true',
        });
    }
    markAlertRead(id) {
        return this.aiStatsService.markAlertRead(id);
    }
    getUnderReviewComments(page, limit) {
        return this.aiStatsService.getUnderReviewComments({ page, limit });
    }
    reviewComment(commentId, decision) {
        return this.aiStatsService.reviewComment(commentId, decision);
    }
};
exports.AdminController = AdminController;
__decorate([
    (0, common_1.Get)('overview'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "getOverview", null);
__decorate([
    (0, common_1.Get)('stats'),
    __param(0, (0, common_1.Query)('days', new common_1.DefaultValuePipe(7), common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "getModerationStats", null);
__decorate([
    (0, common_1.Get)('sentiment'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "getSentiment4Distribution", null);
__decorate([
    (0, common_1.Get)('toxic-by-game'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "getToxicRateByGame", null);
__decorate([
    (0, common_1.Get)('alerts'),
    __param(0, (0, common_1.Query)('limit', new common_1.DefaultValuePipe(20), common_1.ParseIntPipe)),
    __param(1, (0, common_1.Query)('unreadOnly')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "getAlerts", null);
__decorate([
    (0, common_1.Patch)('alerts/:id/read'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "markAlertRead", null);
__decorate([
    (0, common_1.Get)('pending-review'),
    __param(0, (0, common_1.Query)('page', new common_1.DefaultValuePipe(1), common_1.ParseIntPipe)),
    __param(1, (0, common_1.Query)('limit', new common_1.DefaultValuePipe(20), common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "getUnderReviewComments", null);
__decorate([
    (0, common_1.Patch)('review/:commentId'),
    __param(0, (0, common_1.Param)('commentId')),
    __param(1, (0, common_1.Body)('decision')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "reviewComment", null);
exports.AdminController = AdminController = __decorate([
    (0, common_1.Controller)('admin/ai'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    __metadata("design:paramtypes", [ai_stats_service_1.AiStatsService])
], AdminController);
//# sourceMappingURL=admin.controller.js.map