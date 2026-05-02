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
exports.NewsController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../guards/jwt-auth.guard");
const roles_guard_1 = require("../guards/roles.guard");
const roles_decorator_1 = require("../decorators/roles.decorator");
const user_decorator_1 = require("../decorators/user.decorator");
const news_service_1 = require("../services/news.service");
const news_import_worker_service_1 = require("../services/news-import-worker.service");
const news_crawl_worker_service_1 = require("../services/news-crawl-worker.service");
const create_news_dto_1 = require("../dto/news/create-news.dto");
const update_news_dto_1 = require("../dto/news/update-news.dto");
const query_news_dto_1 = require("../dto/news/query-news.dto");
let NewsController = class NewsController {
    newsService;
    newsImportWorkerService;
    newsCrawlWorkerService;
    constructor(newsService, newsImportWorkerService, newsCrawlWorkerService) {
        this.newsService = newsService;
        this.newsImportWorkerService = newsImportWorkerService;
        this.newsCrawlWorkerService = newsCrawlWorkerService;
    }
    listPublic(query) {
        return this.newsService.listPublic(query);
    }
    getPublicBySlug(slug) {
        return this.newsService.getPublicBySlug(slug);
    }
    getPublicById(id) {
        return this.newsService.getPublicById(id);
    }
    listAdmin(admin, query) {
        return this.newsService.listAdmin(admin, query);
    }
    create(admin, dto) {
        return this.newsService.create(admin, dto);
    }
    update(admin, id, dto) {
        return this.newsService.update(admin, id, dto);
    }
    remove(admin, id) {
        return this.newsService.remove(admin, id);
    }
    importRss() {
        return this.newsImportWorkerService.importNow();
    }
    crawlNow() {
        return this.newsCrawlWorkerService.crawlNow();
    }
};
exports.NewsController = NewsController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_news_dto_1.QueryNewsDto]),
    __metadata("design:returntype", void 0)
], NewsController.prototype, "listPublic", null);
__decorate([
    (0, common_1.Get)('slug/:slug'),
    __param(0, (0, common_1.Param)('slug')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], NewsController.prototype, "getPublicBySlug", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], NewsController.prototype, "getPublicById", null);
__decorate([
    (0, common_1.Get)('admin/list'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    __param(0, (0, user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, query_news_dto_1.QueryNewsDto]),
    __metadata("design:returntype", void 0)
], NewsController.prototype, "listAdmin", null);
__decorate([
    (0, common_1.Post)('admin'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    __param(0, (0, user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_news_dto_1.CreateNewsDto]),
    __metadata("design:returntype", void 0)
], NewsController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)('admin/:id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    __param(0, (0, user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, update_news_dto_1.UpdateNewsDto]),
    __metadata("design:returntype", void 0)
], NewsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)('admin/:id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    __param(0, (0, user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], NewsController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)('admin/import-rss'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], NewsController.prototype, "importRss", null);
__decorate([
    (0, common_1.Post)('admin/crawl-now'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], NewsController.prototype, "crawlNow", null);
exports.NewsController = NewsController = __decorate([
    (0, common_1.Controller)('news'),
    __metadata("design:paramtypes", [news_service_1.NewsService,
        news_import_worker_service_1.NewsImportWorkerService,
        news_crawl_worker_service_1.NewsCrawlWorkerService])
], NewsController);
//# sourceMappingURL=news.controller.js.map