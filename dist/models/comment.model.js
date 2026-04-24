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
    parentId;
    authorId;
    content;
    isDeleted;
    deletedAt;
};
exports.Comment = Comment;
__decorate([
    (0, mongoose_1.Prop)({ type: String, required: true, index: true }),
    __metadata("design:type", String)
], Comment.prototype, "postId", void 0);
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
exports.CommentSchema.index({ authorId: 1, createdAt: -1 });
//# sourceMappingURL=comment.model.js.map