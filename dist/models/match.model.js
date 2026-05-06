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
Object.defineProperty(exports, "__esModule", { value: true });
exports.MatchSchema = exports.Match = exports.MatchModelName = void 0;
const mongoose_1 = require("@nestjs/mongoose");
exports.MatchModelName = 'Match';
let Match = class Match {
    externalId;
    game;
    region;
    status;
    startsAt;
    teams;
    matchName;
    tournamentName;
    leagueName;
    serieName;
    numberOfGames;
    endedAt;
    provider;
    syncedAt;
};
exports.Match = Match;
__decorate([
    (0, mongoose_1.Prop)({ type: String, required: true, unique: true, index: true }),
    __metadata("design:type", String)
], Match.prototype, "externalId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, required: true, index: true }),
    __metadata("design:type", String)
], Match.prototype, "game", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, index: true }),
    __metadata("design:type", String)
], Match.prototype, "region", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: String,
        enum: ['live', 'not_started', 'finished'],
        required: true,
        index: true,
    }),
    __metadata("design:type", String)
], Match.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date, index: true }),
    __metadata("design:type", Date)
], Match.prototype, "startsAt", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: [
            {
                name: { type: String, required: true },
                acronym: { type: String },
                imageUrl: { type: String },
                score: { type: Number },
                externalId: { type: Number },
            },
        ],
        default: [],
    }),
    __metadata("design:type", Array)
], Match.prototype, "teams", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String }),
    __metadata("design:type", String)
], Match.prototype, "matchName", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String }),
    __metadata("design:type", String)
], Match.prototype, "tournamentName", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String }),
    __metadata("design:type", String)
], Match.prototype, "leagueName", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String }),
    __metadata("design:type", String)
], Match.prototype, "serieName", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number }),
    __metadata("design:type", Number)
], Match.prototype, "numberOfGames", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date }),
    __metadata("design:type", Date)
], Match.prototype, "endedAt", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, index: true }),
    __metadata("design:type", String)
], Match.prototype, "provider", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date, required: true }),
    __metadata("design:type", Date)
], Match.prototype, "syncedAt", void 0);
exports.Match = Match = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], Match);
exports.MatchSchema = mongoose_1.SchemaFactory.createForClass(Match);
exports.MatchSchema.index({ status: 1, startsAt: 1 });
exports.MatchSchema.index({ game: 1, status: 1, startsAt: 1 });
exports.MatchSchema.index({ region: 1, status: 1, startsAt: 1 });
exports.MatchSchema.index({ game: 1, region: 1, status: 1, startsAt: -1 });
//# sourceMappingURL=match.model.js.map