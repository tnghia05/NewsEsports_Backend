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
exports.CommentLikesService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const comment_like_model_1 = require("../models/comment-like.model");
const comment_model_1 = require("../models/comment.model");
const post_model_1 = require("../models/post.model");
const news_model_1 = require("../models/news.model");
const assert_can_read_post_1 = require("../utils/assert-can-read-post");
let CommentLikesService = class CommentLikesService {
    commentLikeModel;
    commentModel;
    postModel;
    newsModel;
    constructor(commentLikeModel, commentModel, postModel, newsModel) {
        this.commentLikeModel = commentLikeModel;
        this.commentModel = commentModel;
        this.postModel = postModel;
        this.newsModel = newsModel;
    }
    async toggleLike(viewer, commentId) {
        const comment = await this.commentModel.findById(commentId).exec();
        if (!comment)
            throw new common_1.NotFoundException('Comment not found');
        if (comment.isDeleted)
            throw new common_1.ForbiddenException('Comment deleted');
        if (comment.postId) {
            const post = await this.postModel.findById(comment.postId).exec();
            if (!post)
                throw new common_1.NotFoundException('Post not found');
            (0, assert_can_read_post_1.assertCanReadPost)(viewer, post);
        }
        else if (comment.newsId) {
            const news = await this.newsModel.findById(comment.newsId).exec();
            if (!news || news.status !== 'published')
                throw new common_1.NotFoundException('News not found');
        }
        else {
            throw new common_1.NotFoundException('Comment target not found');
        }
        const existing = await this.commentLikeModel
            .findOne({ commentId, userId: viewer.id })
            .exec();
        if (existing) {
            await existing.deleteOne();
            await this.commentModel
                .updateOne({ _id: comment._id }, [
                {
                    $set: {
                        likeCount: { $max: [0, { $subtract: ['$likeCount', 1] }] },
                    },
                },
            ])
                .exec();
            return { liked: false };
        }
        try {
            await this.commentLikeModel.create({ commentId, userId: viewer.id });
        }
        catch {
            return { liked: true };
        }
        await this.commentModel
            .updateOne({ _id: comment._id }, { $inc: { likeCount: 1 } })
            .exec();
        return { liked: true };
    }
};
exports.CommentLikesService = CommentLikesService;
exports.CommentLikesService = CommentLikesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(comment_like_model_1.CommentLikeModelName)),
    __param(1, (0, mongoose_1.InjectModel)(comment_model_1.CommentModelName)),
    __param(2, (0, mongoose_1.InjectModel)(post_model_1.PostModelName)),
    __param(3, (0, mongoose_1.InjectModel)(news_model_1.NewsModelName)),
    __metadata("design:paramtypes", [Function, Function, Function, Function])
], CommentLikesService);
//# sourceMappingURL=comment-likes.service.js.map