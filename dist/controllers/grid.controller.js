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
exports.GridController = void 0;
const common_1 = require("@nestjs/common");
const grid_service_1 = require("../services/grid.service");
let GridController = class GridController {
    grid;
    constructor(grid) {
        this.grid = grid;
    }
    getSchedule(titleIds, from, to, withScores) {
        const ids = titleIds ? titleIds.split(',') : ['28', '2'];
        if (withScores === '1')
            return this.grid.getScheduleWithScores(ids, from, to);
        return this.grid.getSchedule(ids, from, to);
    }
    getLive(titleIds) {
        const ids = titleIds ? titleIds.split(',') : ['28', '2'];
        return this.grid.getLiveSeries(ids);
    }
    getSeriesState(id) {
        return this.grid.getSeriesState(id);
    }
    getSeriesInfo(id) {
        return this.grid.getSeriesInfo(id);
    }
    getTitles() {
        return this.grid.getTitles();
    }
};
exports.GridController = GridController;
__decorate([
    (0, common_1.Get)('schedule'),
    __param(0, (0, common_1.Query)('titleIds')),
    __param(1, (0, common_1.Query)('from')),
    __param(2, (0, common_1.Query)('to')),
    __param(3, (0, common_1.Query)('withScores')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", void 0)
], GridController.prototype, "getSchedule", null);
__decorate([
    (0, common_1.Get)('live'),
    __param(0, (0, common_1.Query)('titleIds')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], GridController.prototype, "getLive", null);
__decorate([
    (0, common_1.Get)('series/:id/state'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], GridController.prototype, "getSeriesState", null);
__decorate([
    (0, common_1.Get)('series/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], GridController.prototype, "getSeriesInfo", null);
__decorate([
    (0, common_1.Get)('titles'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], GridController.prototype, "getTitles", null);
exports.GridController = GridController = __decorate([
    (0, common_1.Controller)('grid'),
    __metadata("design:paramtypes", [grid_service_1.GridService])
], GridController);
//# sourceMappingURL=grid.controller.js.map