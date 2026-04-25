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
exports.SearchController = void 0;
const common_1 = require("@nestjs/common");
const search_service_1 = require("../services/search.service");
const search_posts_dto_1 = require("../dto/search/search-posts.dto");
const search_users_dto_1 = require("../dto/search/search-users.dto");
const create_search_event_dto_1 = require("../dto/search/create-search-event.dto");
const optional_jwt_auth_guard_1 = require("../guards/optional-jwt-auth.guard");
const user_decorator_1 = require("../decorators/user.decorator");
let SearchController = class SearchController {
    searchService;
    constructor(searchService) {
        this.searchService = searchService;
    }
    searchPosts(query) {
        return this.searchService.searchPosts(query);
    }
    searchUsers(query) {
        return this.searchService.searchUsers(query);
    }
    createEvent(user, dto) {
        return this.searchService.createEvent(user, dto);
    }
    hot(window, limit) {
        return this.searchService.getHotKeywords({
            window: window ?? '24h',
            limit: limit ? Number(limit) : 10,
        });
    }
    suggest(q, limit) {
        return this.searchService.suggest({
            q: q ?? '',
            limit: limit ? Number(limit) : 10,
        });
    }
};
exports.SearchController = SearchController;
__decorate([
    (0, common_1.Get)('posts'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [search_posts_dto_1.SearchPostsDto]),
    __metadata("design:returntype", void 0)
], SearchController.prototype, "searchPosts", null);
__decorate([
    (0, common_1.Get)('users'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [search_users_dto_1.SearchUsersDto]),
    __metadata("design:returntype", void 0)
], SearchController.prototype, "searchUsers", null);
__decorate([
    (0, common_1.Post)('events'),
    (0, common_1.UseGuards)(optional_jwt_auth_guard_1.OptionalJwtAuthGuard),
    __param(0, (0, user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_search_event_dto_1.CreateSearchEventDto]),
    __metadata("design:returntype", void 0)
], SearchController.prototype, "createEvent", null);
__decorate([
    (0, common_1.Get)('hot'),
    __param(0, (0, common_1.Query)('window')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], SearchController.prototype, "hot", null);
__decorate([
    (0, common_1.Get)('suggest'),
    __param(0, (0, common_1.Query)('q')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], SearchController.prototype, "suggest", null);
exports.SearchController = SearchController = __decorate([
    (0, common_1.Controller)('search'),
    __metadata("design:paramtypes", [search_service_1.SearchService])
], SearchController);
//# sourceMappingURL=search.controller.js.map