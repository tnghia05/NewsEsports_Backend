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
exports.HotTopicSchema = exports.HotTopic = exports.HotTopicModelName = void 0;
const mongoose_1 = require("@nestjs/mongoose");
exports.HotTopicModelName = 'HotTopic';
let HotTopic = class HotTopic {
    tag;
    window;
    hotness;
    components;
    trend;
    trendUpdatedAt;
    updatedAt;
};
exports.HotTopic = HotTopic;
__decorate([
    (0, mongoose_1.Prop)({ type: String, required: true, index: true }),
    __metadata("design:type", String)
], HotTopic.prototype, "tag", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: String,
        required: true,
        enum: ['3h', '24h', '7d'],
        index: true,
    }),
    __metadata("design:type", String)
], HotTopic.prototype, "window", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, required: true, index: true }),
    __metadata("design:type", Number)
], HotTopic.prototype, "hotness", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: {
            read: { type: Number, required: true },
            discuss: { type: Number, required: true },
            originalUsers: { type: Number, required: true },
            likes: { type: Number, default: 0 },
            searchVolume: { type: Number, default: 0 },
            velocityScore: { type: Number, default: 1 },
        },
        required: true,
    }),
    __metadata("design:type", Object)
], HotTopic.prototype, "components", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: {
            sampleCount: { type: Number, required: true },
            labeledCount: { type: Number, required: true },
            toxicCount: { type: Number, required: true },
            sentiment4: { type: Object, required: true },
            intent: { type: Object, required: true },
            aspect: { type: Object, required: true },
            sentiment4Avg: { type: Object },
            intentAvg: { type: Object },
            aspectAvg: { type: Object },
        },
        default: undefined,
    }),
    __metadata("design:type", Object)
], HotTopic.prototype, "trend", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date, required: false, index: true, default: undefined }),
    __metadata("design:type", Date)
], HotTopic.prototype, "trendUpdatedAt", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date, required: true, index: true }),
    __metadata("design:type", Date)
], HotTopic.prototype, "updatedAt", void 0);
exports.HotTopic = HotTopic = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], HotTopic);
exports.HotTopicSchema = mongoose_1.SchemaFactory.createForClass(HotTopic);
exports.HotTopicSchema.index({ window: 1, hotness: -1 });
exports.HotTopicSchema.index({ window: 1, tag: 1 }, { unique: true });
//# sourceMappingURL=hot-topic.model.js.map