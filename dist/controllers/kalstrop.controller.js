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
exports.KalstropController = void 0;
const common_1 = require("@nestjs/common");
const kalstrop_service_1 = require("../services/kalstrop.service");
const ALLOWED_SPORTS = ['lol', 'cs2', 'dota2', 'r6', 'kog', 'valorant'];
const ALLOWED_TYPES = ['live', 'upcoming', 'popular'];
let KalstropController = class KalstropController {
    kalstrop;
    constructor(kalstrop) {
        this.kalstrop = kalstrop;
    }
    getFixtures(sport, type, region) {
        const s = ALLOWED_SPORTS.includes(sport) ? sport : 'lol';
        const t = ALLOWED_TYPES.includes(type) ? type : 'upcoming';
        return this.kalstrop.getFixtures(s, t, region?.toLowerCase().trim());
    }
    getCompetitions(sport) {
        const categorySlug = `league-of-legends-international`;
        const slugMap = {
            lol: 'league-of-legends-international',
            cs2: 'counter-strike',
            dota2: 'dota-2',
            valorant: 'valorant',
        };
        return this.kalstrop.getCompetitions(slugMap[sport] ?? `${sport}-international`);
    }
    getCompetitionFixtures(slug) {
        return this.kalstrop.getCompetitionFixtures(slug);
    }
    getFixtureDetails(id, group) {
        return this.kalstrop.getFixtureDetails(id, group);
    }
    getFixtureSsr(sport, category, tournament, fixture) {
        return this.kalstrop.getFixtureSsrGroups(sport, category, tournament, fixture);
    }
};
exports.KalstropController = KalstropController;
__decorate([
    (0, common_1.Get)(':sport/:type'),
    __param(0, (0, common_1.Param)('sport')),
    __param(1, (0, common_1.Param)('type')),
    __param(2, (0, common_1.Query)('region')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], KalstropController.prototype, "getFixtures", null);
__decorate([
    (0, common_1.Get)(':sport/competitions'),
    __param(0, (0, common_1.Param)('sport')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], KalstropController.prototype, "getCompetitions", null);
__decorate([
    (0, common_1.Get)('competition/:slug/fixtures'),
    __param(0, (0, common_1.Param)('slug')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], KalstropController.prototype, "getCompetitionFixtures", null);
__decorate([
    (0, common_1.Get)('fixture/:id/details'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('group')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], KalstropController.prototype, "getFixtureDetails", null);
__decorate([
    (0, common_1.Get)('fixture/ssr/groups'),
    __param(0, (0, common_1.Query)('sport')),
    __param(1, (0, common_1.Query)('category')),
    __param(2, (0, common_1.Query)('tournament')),
    __param(3, (0, common_1.Query)('fixture')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", void 0)
], KalstropController.prototype, "getFixtureSsr", null);
exports.KalstropController = KalstropController = __decorate([
    (0, common_1.Controller)('kalstrop'),
    __metadata("design:paramtypes", [kalstrop_service_1.KalstropService])
], KalstropController);
//# sourceMappingURL=kalstrop.controller.js.map