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
exports.UsersController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../guards/jwt-auth.guard");
const optional_jwt_auth_guard_1 = require("../guards/optional-jwt-auth.guard");
const user_decorator_1 = require("../decorators/user.decorator");
const follows_service_1 = require("../services/follows.service");
const posts_service_1 = require("../services/posts.service");
const query_user_posts_dto_1 = require("../dto/users/query-user-posts.dto");
const query_follow_dto_1 = require("../dto/users/query-follow.dto");
let UsersController = class UsersController {
    followsService;
    postsService;
    constructor(followsService, postsService) {
        this.followsService = followsService;
        this.postsService = postsService;
    }
    toggleFollow(user, followeeId) {
        return this.followsService.toggleFollow(user.id, followeeId);
    }
    async listUserPosts(viewer, userId, query) {
        const data = await this.postsService.listByUser(viewer, userId, query);
        const following = viewer ? await this.followsService.isFollowing(viewer.id, userId) : false;
        return { ...data, following };
    }
    async followers(userId, query) {
        return this.followsService.listFollowers(userId, query);
    }
    async following(userId, query) {
        return this.followsService.listFollowing(userId, query);
    }
};
exports.UsersController = UsersController;
__decorate([
    (0, common_1.Post)(':id/follow'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "toggleFollow", null);
__decorate([
    (0, common_1.Get)(':id/posts'),
    (0, common_1.UseGuards)(optional_jwt_auth_guard_1.OptionalJwtAuthGuard),
    __param(0, (0, user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, query_user_posts_dto_1.QueryUserPostsDto]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "listUserPosts", null);
__decorate([
    (0, common_1.Get)(':id/followers'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, query_follow_dto_1.QueryFollowDto]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "followers", null);
__decorate([
    (0, common_1.Get)(':id/following'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, query_follow_dto_1.QueryFollowDto]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "following", null);
exports.UsersController = UsersController = __decorate([
    (0, common_1.Controller)('users'),
    __metadata("design:paramtypes", [follows_service_1.FollowsService,
        posts_service_1.PostsService])
], UsersController);
//# sourceMappingURL=users.controller.js.map