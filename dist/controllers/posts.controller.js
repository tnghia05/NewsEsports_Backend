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
exports.PostsController = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const posts_service_1 = require("../services/posts.service");
const jwt_auth_guard_1 = require("../guards/jwt-auth.guard");
const optional_jwt_auth_guard_1 = require("../guards/optional-jwt-auth.guard");
const user_decorator_1 = require("../decorators/user.decorator");
const roles_decorator_1 = require("../decorators/roles.decorator");
const roles_guard_1 = require("../guards/roles.guard");
const create_post_dto_1 = require("../dto/posts/create-post.dto");
const update_post_dto_1 = require("../dto/posts/update-post.dto");
const query_posts_dto_1 = require("../dto/posts/query-posts.dto");
const post_likes_service_1 = require("../services/post-likes.service");
const post_saves_service_1 = require("../services/post-saves.service");
let PostsController = class PostsController {
    postsService;
    postLikesService;
    postSavesService;
    config;
    constructor(postsService, postLikesService, postSavesService, config) {
        this.postsService = postsService;
        this.postLikesService = postLikesService;
        this.postSavesService = postSavesService;
        this.config = config;
    }
    list(user, query) {
        return this.postsService.list(user, query);
    }
    getById(user, id) {
        return this.postsService.getById(user, id);
    }
    getCommentDigest(id, force) {
        const apiKey = this.config.get('GEMINI_API_KEY', { infer: true }) ?? null;
        const forceRebuild = force === 'true';
        return this.postsService.getCommentDigest(id, apiKey, forceRebuild);
    }
    create(user, body) {
        return this.postsService.create(user, body);
    }
    update(user, id, body) {
        return this.postsService.update(user, id, body);
    }
    remove(user, id) {
        return this.postsService.remove(user, id);
    }
    toggleLike(user, id) {
        return this.postLikesService.toggleLike(user, id);
    }
    toggleSave(user, id) {
        return this.postSavesService.toggleSave(user, id);
    }
    getLikes(id, page, limit) {
        return this.postsService.listLikes(id, {
            page: page ? Number(page) : 1,
            limit: limit ? Number(limit) : 20,
        });
    }
    pin(id) {
        return this.postsService.pin(id);
    }
    unpin(id) {
        return this.postsService.unpin(id);
    }
};
exports.PostsController = PostsController;
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(optional_jwt_auth_guard_1.OptionalJwtAuthGuard),
    __param(0, (0, user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, query_posts_dto_1.QueryPostsDto]),
    __metadata("design:returntype", void 0)
], PostsController.prototype, "list", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, common_1.UseGuards)(optional_jwt_auth_guard_1.OptionalJwtAuthGuard),
    __param(0, (0, user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], PostsController.prototype, "getById", null);
__decorate([
    (0, common_1.Get)(':id/comment-digest'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('force')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], PostsController.prototype, "getCommentDigest", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_post_dto_1.CreatePostDto]),
    __metadata("design:returntype", void 0)
], PostsController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, update_post_dto_1.UpdatePostDto]),
    __metadata("design:returntype", void 0)
], PostsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], PostsController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)(':id/like'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], PostsController.prototype, "toggleLike", null);
__decorate([
    (0, common_1.Post)(':id/save'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], PostsController.prototype, "toggleSave", null);
__decorate([
    (0, common_1.Get)(':id/likes'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], PostsController.prototype, "getLikes", null);
__decorate([
    (0, common_1.Post)(':id/pin'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PostsController.prototype, "pin", null);
__decorate([
    (0, common_1.Post)(':id/unpin'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PostsController.prototype, "unpin", null);
exports.PostsController = PostsController = __decorate([
    (0, common_1.Controller)('posts'),
    __metadata("design:paramtypes", [posts_service_1.PostsService,
        post_likes_service_1.PostLikesService,
        post_saves_service_1.PostSavesService,
        config_1.ConfigService])
], PostsController);
//# sourceMappingURL=posts.controller.js.map