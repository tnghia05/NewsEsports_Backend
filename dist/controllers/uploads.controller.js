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
exports.UploadsController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../guards/jwt-auth.guard");
const user_decorator_1 = require("../decorators/user.decorator");
const r2_service_1 = require("../infra/r2/r2.service");
const r2_presign_dto_1 = require("../dto/uploads/r2-presign.dto");
let UploadsController = class UploadsController {
    r2;
    constructor(r2) {
        this.r2 = r2;
    }
    presign(user, dto) {
        return this.r2.presignPutObject({
            fileName: dto.fileName,
            contentType: dto.contentType,
            folder: dto.folder ?? 'misc',
            userId: user.id,
        });
    }
};
exports.UploadsController = UploadsController;
__decorate([
    (0, common_1.Post)('r2/presign'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, r2_presign_dto_1.R2PresignDto]),
    __metadata("design:returntype", void 0)
], UploadsController.prototype, "presign", null);
exports.UploadsController = UploadsController = __decorate([
    (0, common_1.Controller)('uploads'),
    __metadata("design:paramtypes", [r2_service_1.R2Service])
], UploadsController);
//# sourceMappingURL=uploads.controller.js.map