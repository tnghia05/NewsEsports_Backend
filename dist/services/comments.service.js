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
const notifications_service_1 = require("./notifications.service");
let CommentsService = class CommentsService {
    commentModel;
    postModel;
    notificationsService;
    constructor(commentModel, postModel, notificationsService) {
        this.commentModel = commentModel;
        this.postModel = postModel;
        this.notificationsService = notificationsService;
    }
    async listForPost(viewer, postId, query) {
        const post = await this.requirePost(postId);
        assertCanReadPost(viewer, post);
        const page = query.page;
        const limit = query.limit;
        const skip = (page - 1) * limit;
        const filter = { postId };
        if (query.parentId) {
            filter.parentId = query.parentId;
        }
        else if (query.topLevelOnly) {
            filter.parentId = { $exists: false };
        }
        const sort = query.sort === 'newest'
            ? { createdAt: -1 }
            : { createdAt: 1 };
        const items = await this.commentModel
            .find(filter)
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .exec();
        const total = await this.commentModel.countDocuments(filter).exec();
        const hasMore = skip + items.length < total;
        return { items, page, limit, total, hasMore };
    }
    async createForPost(viewer, postId, dto) {
        const post = await this.requirePost(postId);
        assertCanReadPost(viewer, post);
        let parentAuthorId;
        if (dto.parentId) {
            const parent = await this.requireComment(dto.parentId);
            if (parent.postId !== postId) {
                throw new common_1.ForbiddenException('Parent comment mismatch');
            }
            if (parent.isDeleted) {
                throw new common_1.ForbiddenException('Cannot reply to deleted comment');
            }
            parentAuthorId = parent.authorId;
        }
        const created = await this.commentModel.create({
            postId,
            parentId: dto.parentId,
            authorId: viewer.id,
            content: dto.content,
            isDeleted: false,
        });
        await this.postModel
            .updateOne({ _id: post._id }, { $inc: { commentCount: 1 } })
            .exec();
        if (!dto.parentId) {
            await this.notificationsService.create({
                userId: post.authorId,
                actorId: viewer.id,
                type: 'comment',
                postId: String(post._id),
                commentId: String(created._id),
            });
        }
        else if (parentAuthorId) {
            await this.notificationsService.create({
                userId: parentAuthorId,
                actorId: viewer.id,
                type: 'reply',
                postId: String(post._id),
                commentId: String(created._id),
            });
        }
        return created;
    }
    async update(viewer, commentId, dto) {
        const comment = await this.requireComment(commentId);
        assertCanEditComment(viewer, comment);
        if (comment.isDeleted)
            throw new common_1.ForbiddenException('Comment deleted');
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
        if (comment.isDeleted)
            return { ok: true };
        await this.commentModel
            .updateOne({ _id: comment._id }, { $set: { isDeleted: true, deletedAt: new Date(), content: '[deleted]' } })
            .exec();
        await this.postModel
            .updateOne({ _id: comment.postId }, [
            {
                $set: {
                    commentCount: {
                        $max: [0, { $subtract: ['$commentCount', 1] }],
                    },
                },
            },
        ])
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
    __metadata("design:paramtypes", [Function, Function, notifications_service_1.NotificationsService])
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