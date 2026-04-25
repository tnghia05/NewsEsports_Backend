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
exports.CommentModerationJobSchema = exports.CommentModerationJob = exports.CommentModerationJobModelName = void 0;
const mongoose_1 = require("@nestjs/mongoose");
exports.CommentModerationJobModelName = 'CommentModerationJob';
let CommentModerationJob = class CommentModerationJob {
    commentId;
    status;
    attempts;
    nextRunAt;
    lockedAt;
    lastError;
};
exports.CommentModerationJob = CommentModerationJob;
__decorate([
    (0, mongoose_1.Prop)({ type: String, required: true, index: true, unique: true }),
    __metadata("design:type", String)
], CommentModerationJob.prototype, "commentId", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: String,
        required: true,
        enum: ['pending', 'processing', 'done', 'failed'],
        default: 'pending',
        index: true,
    }),
    __metadata("design:type", String)
], CommentModerationJob.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, default: 0 }),
    __metadata("design:type", Number)
], CommentModerationJob.prototype, "attempts", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date, index: true }),
    __metadata("design:type", Date)
], CommentModerationJob.prototype, "nextRunAt", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date }),
    __metadata("design:type", Date)
], CommentModerationJob.prototype, "lockedAt", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String }),
    __metadata("design:type", String)
], CommentModerationJob.prototype, "lastError", void 0);
exports.CommentModerationJob = CommentModerationJob = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], CommentModerationJob);
exports.CommentModerationJobSchema = mongoose_1.SchemaFactory.createForClass(CommentModerationJob);
exports.CommentModerationJobSchema.index({ status: 1, nextRunAt: 1, createdAt: 1 });
//# sourceMappingURL=comment-moderation-job.model.js.map