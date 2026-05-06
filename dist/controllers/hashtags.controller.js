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
exports.HashtagsController = void 0;
const common_1 = require("@nestjs/common");
const hashtags_service_1 = require("../services/hashtags.service");
const query_hashtag_posts_dto_1 = require("../dto/hashtags/query-hashtag-posts.dto");
const trending_hashtags_dto_1 = require("../dto/hashtags/trending-hashtags.dto");
const hot_topics_dto_1 = require("../dto/hashtags/hot-topics.dto");
const create_hashtag_event_dto_1 = require("../dto/hashtags/create-hashtag-event.dto");
const optional_jwt_auth_guard_1 = require("../guards/optional-jwt-auth.guard");
const user_decorator_1 = require("../decorators/user.decorator");
let HashtagsController = class HashtagsController {
    hashtagsService;
    constructor(hashtagsService) {
        this.hashtagsService = hashtagsService;
    }
    listPosts(tag, query) {
        return this.hashtagsService.listPostsByTag(tag, query);
    }
    trending(query) {
        return this.hashtagsService.trending(query.window);
    }
    createEvent(user, dto) {
        return this.hashtagsService.createEvent(user, dto);
    }
    hotTopics(query) {
        return this.hashtagsService.hotTopics(query);
    }
};
exports.HashtagsController = HashtagsController;
__decorate([
    (0, common_1.Get)(':tag/posts'),
    __param(0, (0, common_1.Param)('tag')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, query_hashtag_posts_dto_1.QueryHashtagPostsDto]),
    __metadata("design:returntype", void 0)
], HashtagsController.prototype, "listPosts", null);
__decorate([
    (0, common_1.Get)('trending'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [trending_hashtags_dto_1.TrendingHashtagsDto]),
    __metadata("design:returntype", void 0)
], HashtagsController.prototype, "trending", null);
__decorate([
    (0, common_1.Post)('events'),
    (0, common_1.UseGuards)(optional_jwt_auth_guard_1.OptionalJwtAuthGuard),
    __param(0, (0, user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_hashtag_event_dto_1.CreateHashtagEventDto]),
    __metadata("design:returntype", void 0)
], HashtagsController.prototype, "createEvent", null);
__decorate([
    (0, common_1.Get)('hot-topics'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [hot_topics_dto_1.HotTopicsDto]),
    __metadata("design:returntype", void 0)
], HashtagsController.prototype, "hotTopics", null);
exports.HashtagsController = HashtagsController = __decorate([
    (0, common_1.Controller)('hashtags'),
    __metadata("design:paramtypes", [hashtags_service_1.HashtagsService])
], HashtagsController);
//# sourceMappingURL=hashtags.controller.js.map