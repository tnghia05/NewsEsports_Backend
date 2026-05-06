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
exports.MatchesService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const match_model_1 = require("../models/match.model");
let MatchesService = class MatchesService {
    matchModel;
    constructor(matchModel) {
        this.matchModel = matchModel;
    }
    async list(query) {
        const page = Math.max(1, Number(query.page) || 1);
        const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
        const skip = (page - 1) * limit;
        const filter = {};
        const tab = query.tab ?? 'all';
        if (tab === 'live')
            filter['status'] = 'live';
        else if (tab === 'upcoming')
            filter['status'] = 'not_started';
        else if (tab === 'finished')
            filter['status'] = 'finished';
        if (query.game)
            filter['game'] = query.game.toLowerCase().trim();
        if (query.region) {
            filter['region'] = {
                $regex: new RegExp(escapeRegex(query.region.trim()), 'i'),
            };
        }
        const sort = tab === 'finished' ? { startsAt: -1 } : { startsAt: 1 };
        const [items, total] = await Promise.all([
            this.matchModel
                .find(filter)
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .lean()
                .exec(),
            this.matchModel.countDocuments(filter).exec(),
        ]);
        return { items, page, limit, total, hasMore: skip + items.length < total };
    }
    async getById(id) {
        const match = await this.matchModel.findById(id).lean().exec();
        if (!match)
            throw new common_1.NotFoundException('Match not found');
        return match;
    }
    async getStats() {
        const [live, upcoming, finished] = await Promise.all([
            this.matchModel.countDocuments({ status: 'live' }),
            this.matchModel.countDocuments({ status: 'not_started' }),
            this.matchModel.countDocuments({ status: 'finished' }),
        ]);
        return { live, upcoming, finished, total: live + upcoming + finished };
    }
};
exports.MatchesService = MatchesService;
exports.MatchesService = MatchesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(match_model_1.MatchModelName)),
    __metadata("design:paramtypes", [Function])
], MatchesService);
function escapeRegex(input) {
    return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
//# sourceMappingURL=matches.service.js.map