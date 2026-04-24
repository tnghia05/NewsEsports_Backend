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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommentsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const comment_model_1 = require("../models/comment.model");
const post_model_1 = require("../models/post.model");
let CommentsService = class CommentsService {
    commentModel;
    postModel;
    constructor(commentModel, postModel) {
        this.commentModel = commentModel;
        this.postModel = postModel;
    }
    async listForPost(viewer, postId, query) {
        const post = await this.requirePost(postId);
        assertCanReadPost(viewer, post);
        const page = query.page;
        const limit = query.limit;
        const skip = (page - 1) * limit;
        const items = await this.commentModel
            .find({ postId })
            .sort({ createdAt: 1 })
            .skip(skip)
            .limit(limit)
            .exec();
        return { items, page, limit };
    }
    async createForPost(viewer, postId, dto) {
        const post = await this.requirePost(postId);
        assertCanReadPost(viewer, post);
        const created = await this.commentModel.create({
            postId,
            authorId: viewer.id,
            content: dto.content,
        });
        await this.postModel
            .updateOne({ _id: post._id }, { $inc: { commentCount: 1 } })
            .exec();
        return created;
    }
    async update(viewer, commentId, dto) {
        const comment = await this.requireComment(commentId);
        assertCanEditComment(viewer, comment);
        const patch = {};
        if (dto.content !== undefined)
            patch.content = dto.content;
        const updated = await this.commentModel
            .findByIdAndUpdate(comment._id, { $set: patch }, { new: true })
            .exec();
        if (!updated)
            throw new common_1.NotFoundException('Comment not found');
        return updated;
    }
    async remove(viewer, commentId) {
        const comment = await this.requireComment(commentId);
        assertCanEditComment(viewer, comment);
        await comment.deleteOne();
        await this.postModel
            .updateOne({ _id: comment.postId }, { $inc: { commentCount: -1 } })
            .exec();
        return { ok: true };
    }
    async requireComment(commentId) {
        const comment = await this.commentModel.findById(commentId).exec();
        if (!comment)
            throw new common_1.NotFoundException('Comment not found');
        return comment;
    }
    async requirePost(postId) {
        const post = await this.postModel.findById(postId).exec();
        if (!post)
            throw new common_1.NotFoundException('Post not found');
        return post;
    }
};
exports.CommentsService = CommentsService;
exports.CommentsService = CommentsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(comment_model_1.CommentModelName)),
    __param(1, (0, mongoose_1.InjectModel)(post_model_1.PostModelName)),
    __metadata("design:paramtypes", [Function, Function])
], CommentsService);
function assertCanReadPost(viewer, post) {
    if (post.status === 'published')
        return;
    if (!viewer)
        throw new common_1.ForbiddenException('Forbidden');
    if (viewer.role === 'admin')
        return;
    if (post.authorId === viewer.id)
        return;
    throw new common_1.ForbiddenException('Forbidden');
}
function assertCanEditComment(viewer, comment) {
    if (viewer.role === 'admin')
        return;
    if (comment.authorId === viewer.id)
        return;
    throw new common_1.ForbiddenException('Forbidden');
}
//# sourceMappingURL=comments.service.js.map