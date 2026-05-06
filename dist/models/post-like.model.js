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
exports.PostLikeSchema = exports.PostLike = exports.PostLikeModelName = void 0;
const mongoose_1 = require("@nestjs/mongoose");
exports.PostLikeModelName = 'PostLike';
let PostLike = class PostLike {
    postId;
    userId;
};
exports.PostLike = PostLike;
__decorate([
    (0, mongoose_1.Prop)({ type: String, required: true, index: true }),
    __metadata("design:type", String)
], PostLike.prototype, "postId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, required: true, index: true }),
    __metadata("design:type", String)
], PostLike.prototype, "userId", void 0);
exports.PostLike = PostLike = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], PostLike);
exports.PostLikeSchema = mongoose_1.SchemaFactory.createForClass(PostLike);
exports.PostLikeSchema.index({ postId: 1, userId: 1 }, { unique: true });
exports.PostLikeSchema.index({ userId: 1, createdAt: -1 });
//# sourceMappingURL=post-like.model.js.map