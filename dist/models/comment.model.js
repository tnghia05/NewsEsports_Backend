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
exports.CommentSchema = exports.Comment = exports.CommentModelName = void 0;
const mongoose_1 = require("@nestjs/mongoose");
exports.CommentModelName = 'Comment';
let Comment = class Comment {
    postId;
    newsId;
    parentId;
    authorId;
    content;
    moderationStatus;
    sentiment;
    toxicity;
    sentiment4;
    intent;
    aspects;
    sentiment4Scores;
    intentScores;
    aspectScores;
    aiVersion;
    aiError;
    qualityScore;
    aiEntities;
    likeCount;
    isDeleted;
    deletedAt;
};
exports.Comment = Comment;
__decorate([
    (0, mongoose_1.Prop)({ type: String, index: true }),
    __metadata("design:type", String)
], Comment.prototype, "postId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, index: true }),
    __metadata("design:type", String)
], Comment.prototype, "newsId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, index: true }),
    __metadata("design:type", String)
], Comment.prototype, "parentId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, required: true, index: true }),
    __metadata("design:type", String)
], Comment.prototype, "authorId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, required: true }),
    __metadata("design:type", String)
], Comment.prototype, "content", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: String,
        required: true,
        enum: ['pending', 'approved', 'rejected', 'under_review'],
        default: 'pending',
        index: true,
    }),
    __metadata("design:type", String)
], Comment.prototype, "moderationStatus", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: String,
        enum: ['positive', 'neutral', 'negative'],
        index: true,
    }),
    __metadata("design:type", String)
], Comment.prototype, "sentiment", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: {
            isToxic: { type: Boolean, required: true },
            score: { type: Number, required: true },
        },
    }),
    __metadata("design:type", Object)
], Comment.prototype, "toxicity", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: String,
        enum: ['positive', 'negative', 'neutral', 'toxic'],
        index: true,
    }),
    __metadata("design:type", String)
], Comment.prototype, "sentiment4", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, enum: ['praise', 'complain', 'question', 'other'] }),
    __metadata("design:type", String)
], Comment.prototype, "intent", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [String] }),
    __metadata("design:type", Array)
], Comment.prototype, "aspects", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Object }),
    __metadata("design:type", Object)
], Comment.prototype, "sentiment4Scores", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Object }),
    __metadata("design:type", Object)
], Comment.prototype, "intentScores", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Object }),
    __metadata("design:type", Object)
], Comment.prototype, "aspectScores", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String }),
    __metadata("design:type", String)
], Comment.prototype, "aiVersion", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String }),
    __metadata("design:type", String)
], Comment.prototype, "aiError", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number }),
    __metadata("design:type", Number)
], Comment.prototype, "qualityScore", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [{ text: { type: String }, type: { type: String }, _id: false }] }),
    __metadata("design:type", Array)
], Comment.prototype, "aiEntities", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, default: 0 }),
    __metadata("design:type", Number)
], Comment.prototype, "likeCount", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Boolean, default: false, index: true }),
    __metadata("design:type", Boolean)
], Comment.prototype, "isDeleted", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date }),
    __metadata("design:type", Date)
], Comment.prototype, "deletedAt", void 0);
exports.Comment = Comment = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], Comment);
exports.CommentSchema = mongoose_1.SchemaFactory.createForClass(Comment);
exports.CommentSchema.index({ postId: 1, createdAt: 1 });
exports.CommentSchema.index({ postId: 1, parentId: 1, createdAt: 1 });
exports.CommentSchema.index({ newsId: 1, createdAt: 1 });
exports.CommentSchema.index({ newsId: 1, parentId: 1, createdAt: 1 });
exports.CommentSchema.index({ authorId: 1, createdAt: -1 });
//# sourceMappingURL=comment.model.js.map