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
exports.PlacePredictionDto = void 0;
const class_validator_1 = require("class-validator");
class PlacePredictionDto {
    matchId;
    teamIndex;
    pointsBet;
    oddsSnapshot;
}
exports.PlacePredictionDto = PlacePredictionDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PlacePredictionDto.prototype, "matchId", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsIn)([0, 1]),
    __metadata("design:type", Number)
], PlacePredictionDto.prototype, "teamIndex", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], PlacePredictionDto.prototype, "pointsBet", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], PlacePredictionDto.prototype, "oddsSnapshot", void 0);
//# sourceMappingURL=place-prediction.dto.js.map