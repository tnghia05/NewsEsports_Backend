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
exports.PredictionSchema = exports.Prediction = exports.PredictionModelName = void 0;
const mongoose_1 = require("@nestjs/mongoose");
exports.PredictionModelName = 'Prediction';
let Prediction = class Prediction {
    userId;
    matchId;
    teamIndex;
    teamName;
    pointsBet;
    oddsAtBet;
    status;
    pointsWon;
    settledAt;
};
exports.Prediction = Prediction;
__decorate([
    (0, mongoose_1.Prop)({ type: String, required: true, index: true }),
    __metadata("design:type", String)
], Prediction.prototype, "userId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, required: true, index: true }),
    __metadata("design:type", String)
], Prediction.prototype, "matchId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, required: true }),
    __metadata("design:type", Number)
], Prediction.prototype, "teamIndex", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, required: true }),
    __metadata("design:type", String)
], Prediction.prototype, "teamName", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, required: true, min: 1 }),
    __metadata("design:type", Number)
], Prediction.prototype, "pointsBet", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, required: true }),
    __metadata("design:type", Number)
], Prediction.prototype, "oddsAtBet", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: String,
        required: true,
        enum: ['pending', 'won', 'lost', 'cancelled'],
        default: 'pending',
        index: true,
    }),
    __metadata("design:type", String)
], Prediction.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number }),
    __metadata("design:type", Number)
], Prediction.prototype, "pointsWon", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date }),
    __metadata("design:type", Date)
], Prediction.prototype, "settledAt", void 0);
exports.Prediction = Prediction = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], Prediction);
exports.PredictionSchema = mongoose_1.SchemaFactory.createForClass(Prediction);
exports.PredictionSchema.index({ userId: 1, createdAt: -1 });
exports.PredictionSchema.index({ matchId: 1, status: 1 });
exports.PredictionSchema.index({ userId: 1, matchId: 1 }, { unique: true });
//# sourceMappingURL=prediction.model.js.map