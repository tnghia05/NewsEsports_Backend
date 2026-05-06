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
exports.PostLikesService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const post_like_model_1 = require("../models/post-like.model");
const post_model_1 = require("../models/post.model");
const notifications_service_1 = require("./notifications.service");
const assert_can_read_post_1 = require("../utils/assert-can-read-post");
let PostLikesService = class PostLikesService {
    postLikeModel;
    postModel;
    notificationsService;
    constructor(postLikeModel, postModel, notificationsService) {
        this.postLikeModel = postLikeModel;
        this.postModel = postModel;
        this.notificationsService = notificationsService;
    }
    async toggleLike(viewer, postId) {
        const post = await this.postModel.findById(postId).exec();
        if (!post)
            throw new common_1.NotFoundException('Post not found');
        (0, assert_can_read_post_1.assertCanReadPost)(viewer, post);
        const existing = await this.postLikeModel
            .findOne({ postId, userId: viewer.id })
            .exec();
        if (existing) {
            await existing.deleteOne();
            await this.postModel
                .updateOne({ _id: post._id }, [
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
            await this.postLikeModel.create({ postId, userId: viewer.id });
        }
        catch {
            return { liked: true };
        }
        await this.postModel
            .updateOne({ _id: post._id }, { $inc: { likeCount: 1 } })
            .exec();
        if (viewer.id !== post.authorId) {
            await this.notificationsService.create({
                userId: post.authorId,
                actorId: viewer.id,
                type: 'post_like',
                postId: String(post._id),
            });
        }
        return { liked: true };
    }
};
exports.PostLikesService = PostLikesService;
exports.PostLikesService = PostLikesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(post_like_model_1.PostLikeModelName)),
    __param(1, (0, mongoose_1.InjectModel)(post_model_1.PostModelName)),
    __metadata("design:paramtypes", [Function, Function, notifications_service_1.NotificationsService])
], PostLikesService);
//# sourceMappingURL=post-likes.service.js.map