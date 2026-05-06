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
exports.CommentsController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../guards/jwt-auth.guard");
const optional_jwt_auth_guard_1 = require("../guards/optional-jwt-auth.guard");
const user_decorator_1 = require("../decorators/user.decorator");
const comments_service_1 = require("../services/comments.service");
const comment_likes_service_1 = require("../services/comment-likes.service");
const query_comments_dto_1 = require("../dto/comments/query-comments.dto");
const create_comment_dto_1 = require("../dto/comments/create-comment.dto");
const update_comment_dto_1 = require("../dto/comments/update-comment.dto");
let CommentsController = class CommentsController {
    commentsService;
    commentLikesService;
    constructor(commentsService, commentLikesService) {
        this.commentsService = commentsService;
        this.commentLikesService = commentLikesService;
    }
    listForPost(user, postId, query) {
        return this.commentsService.listForPost(user, postId, query);
    }
    listForNews(user, newsId, query) {
        return this.commentsService.listForNews(user, newsId, query);
    }
    listReplies(user, id, query) {
        return this.commentsService.listReplies(user, id, query);
    }
    createForPost(user, postId, body) {
        return this.commentsService.createForPost(user, postId, body);
    }
    createForNews(user, newsId, body) {
        return this.commentsService.createForNews(user, newsId, body);
    }
    update(user, id, body) {
        return this.commentsService.update(user, id, body);
    }
    remove(user, id) {
        return this.commentsService.remove(user, id);
    }
    toggleLike(user, id) {
        return this.commentLikesService.toggleLike(user, id);
    }
};
exports.CommentsController = CommentsController;
__decorate([
    (0, common_1.Get)('posts/:postId/comments'),
    (0, common_1.UseGuards)(optional_jwt_auth_guard_1.OptionalJwtAuthGuard),
    __param(0, (0, user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('postId')),
    __param(2, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, query_comments_dto_1.QueryCommentsDto]),
    __metadata("design:returntype", void 0)
], CommentsController.prototype, "listForPost", null);
__decorate([
    (0, common_1.Get)('news/:newsId/comments'),
    (0, common_1.UseGuards)(optional_jwt_auth_guard_1.OptionalJwtAuthGuard),
    __param(0, (0, user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('newsId')),
    __param(2, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, query_comments_dto_1.QueryCommentsDto]),
    __metadata("design:returntype", void 0)
], CommentsController.prototype, "listForNews", null);
__decorate([
    (0, common_1.Get)('comments/:id/replies'),
    (0, common_1.UseGuards)(optional_jwt_auth_guard_1.OptionalJwtAuthGuard),
    __param(0, (0, user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, query_comments_dto_1.QueryCommentsDto]),
    __metadata("design:returntype", void 0)
], CommentsController.prototype, "listReplies", null);
__decorate([
    (0, common_1.Post)('posts/:postId/comments'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('postId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, create_comment_dto_1.CreateCommentDto]),
    __metadata("design:returntype", void 0)
], CommentsController.prototype, "createForPost", null);
__decorate([
    (0, common_1.Post)('news/:newsId/comments'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('newsId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, create_comment_dto_1.CreateCommentDto]),
    __metadata("design:returntype", void 0)
], CommentsController.prototype, "createForNews", null);
__decorate([
    (0, common_1.Patch)('comments/:id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, update_comment_dto_1.UpdateCommentDto]),
    __metadata("design:returntype", void 0)
], CommentsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)('comments/:id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], CommentsController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)('comments/:id/like'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], CommentsController.prototype, "toggleLike", null);
exports.CommentsController = CommentsController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [comments_service_1.CommentsService,
        comment_likes_service_1.CommentLikesService])
], CommentsController);
//# sourceMappingURL=comments.controller.js.map