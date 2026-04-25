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
exports.HotKeywordSchema = exports.HotKeyword = exports.HotKeywordModelName = void 0;
const mongoose_1 = require("@nestjs/mongoose");
exports.HotKeywordModelName = 'HotKeyword';
let HotKeyword = class HotKeyword {
    keyword;
    window;
    score;
    updatedAt;
};
exports.HotKeyword = HotKeyword;
__decorate([
    (0, mongoose_1.Prop)({ type: String, required: true, index: true }),
    __metadata("design:type", String)
], HotKeyword.prototype, "keyword", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: String,
        required: true,
        enum: ['24h', '7d'],
        index: true,
    }),
    __metadata("design:type", String)
], HotKeyword.prototype, "window", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, required: true, index: true }),
    __metadata("design:type", Number)
], HotKeyword.prototype, "score", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date, required: true, index: true }),
    __metadata("design:type", Date)
], HotKeyword.prototype, "updatedAt", void 0);
exports.HotKeyword = HotKeyword = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], HotKeyword);
exports.HotKeywordSchema = mongoose_1.SchemaFactory.createForClass(HotKeyword);
exports.HotKeywordSchema.index({ window: 1, score: -1 });
exports.HotKeywordSchema.index({ window: 1, keyword: 1 }, { unique: true });
//# sourceMappingURL=hot-keyword.model.js.map