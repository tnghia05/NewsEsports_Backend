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
exports.EntityTrendSchema = exports.EntityTrend = exports.EntityTrendModelName = void 0;
const mongoose_1 = require("@nestjs/mongoose");
exports.EntityTrendModelName = 'EntityTrend';
let EntityTrend = class EntityTrend {
    entity;
    entityType;
    window;
    mentionCount;
    sentiment;
    toxicRate;
    intent;
    updatedAt;
};
exports.EntityTrend = EntityTrend;
__decorate([
    (0, mongoose_1.Prop)({ type: String, required: true, index: true }),
    __metadata("design:type", String)
], EntityTrend.prototype, "entity", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, required: true, enum: ['PLAYER', 'TEAM', 'TOURNAMENT'] }),
    __metadata("design:type", String)
], EntityTrend.prototype, "entityType", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: String,
        required: true,
        enum: ['3h', '24h', '7d'],
        index: true,
    }),
    __metadata("design:type", String)
], EntityTrend.prototype, "window", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, required: true, index: true }),
    __metadata("design:type", Number)
], EntityTrend.prototype, "mentionCount", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: {
            positive: { type: Number, required: true },
            negative: { type: Number, required: true },
            neutral: { type: Number, required: true },
            toxic: { type: Number, required: true },
        },
        required: true,
    }),
    __metadata("design:type", Object)
], EntityTrend.prototype, "sentiment", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, required: true }),
    __metadata("design:type", Number)
], EntityTrend.prototype, "toxicRate", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: {
            praise: { type: Number, required: true },
            complain: { type: Number, required: true },
            question: { type: Number, required: true },
            other: { type: Number, required: true },
        },
        required: true,
    }),
    __metadata("design:type", Object)
], EntityTrend.prototype, "intent", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date, required: true, index: true }),
    __metadata("design:type", Date)
], EntityTrend.prototype, "updatedAt", void 0);
exports.EntityTrend = EntityTrend = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], EntityTrend);
exports.EntityTrendSchema = mongoose_1.SchemaFactory.createForClass(EntityTrend);
exports.EntityTrendSchema.index({ entity: 1, entityType: 1, window: 1 }, { unique: true });
exports.EntityTrendSchema.index({ window: 1, mentionCount: -1 });
exports.EntityTrendSchema.index({ window: 1, entityType: 1, mentionCount: -1 });
//# sourceMappingURL=entity-trend.model.js.map