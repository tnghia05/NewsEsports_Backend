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
exports.RssSourcesController = void 0;
const common_1 = require("@nestjs/common");
const roles_decorator_1 = require("../decorators/roles.decorator");
const user_decorator_1 = require("../decorators/user.decorator");
const jwt_auth_guard_1 = require("../guards/jwt-auth.guard");
const roles_guard_1 = require("../guards/roles.guard");
const create_rss_source_dto_1 = require("../dto/rss/create-rss-source.dto");
const update_rss_source_dto_1 = require("../dto/rss/update-rss-source.dto");
const rss_sources_service_1 = require("../services/rss-sources.service");
let RssSourcesController = class RssSourcesController {
    rssSourcesService;
    constructor(rssSourcesService) {
        this.rssSourcesService = rssSourcesService;
    }
    list(admin) {
        return this.rssSourcesService.listAdmin(admin);
    }
    create(admin, dto) {
        return this.rssSourcesService.create(admin, dto);
    }
    update(admin, id, dto) {
        return this.rssSourcesService.update(admin, id, dto);
    }
    remove(admin, id) {
        return this.rssSourcesService.remove(admin, id);
    }
};
exports.RssSourcesController = RssSourcesController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], RssSourcesController.prototype, "list", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_rss_source_dto_1.CreateRssSourceDto]),
    __metadata("design:returntype", void 0)
], RssSourcesController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, update_rss_source_dto_1.UpdateRssSourceDto]),
    __metadata("design:returntype", void 0)
], RssSourcesController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], RssSourcesController.prototype, "remove", null);
exports.RssSourcesController = RssSourcesController = __decorate([
    (0, common_1.Controller)('admin/rss-sources'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    __metadata("design:paramtypes", [rss_sources_service_1.RssSourcesService])
], RssSourcesController);
//# sourceMappingURL=rss-sources.controller.js.map