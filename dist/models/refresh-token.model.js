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
Object.defineProperty(exports, "__esModule", { value: true });
exports.RefreshTokenSchema = exports.RefreshToken = exports.RefreshTokenModelName = void 0;
const mongoose_1 = require("@nestjs/mongoose");
exports.RefreshTokenModelName = 'RefreshToken';
let RefreshToken = class RefreshToken {
    userId;
    jti;
    tokenHash;
    expiresAt;
    revokedAt;
    replacedByJti;
};
exports.RefreshToken = RefreshToken;
__decorate([
    (0, mongoose_1.Prop)({ type: String, required: true, index: true }),
    __metadata("design:type", String)
], RefreshToken.prototype, "userId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, required: true, unique: true, index: true }),
    __metadata("design:type", String)
], RefreshToken.prototype, "jti", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, required: true }),
    __metadata("design:type", String)
], RefreshToken.prototype, "tokenHash", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date, required: true, index: true }),
    __metadata("design:type", Date)
], RefreshToken.prototype, "expiresAt", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date }),
    __metadata("design:type", Date)
], RefreshToken.prototype, "revokedAt", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String }),
    __metadata("design:type", String)
], RefreshToken.prototype, "replacedByJti", void 0);
exports.RefreshToken = RefreshToken = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], RefreshToken);
exports.RefreshTokenSchema = mongoose_1.SchemaFactory.createForClass(RefreshToken);
//# sourceMappingURL=refresh-token.model.js.map