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
exports.RssSourceSchema = exports.RssSource = exports.RssSourceModelName = void 0;
const mongoose_1 = require("@nestjs/mongoose");
exports.RssSourceModelName = 'RssSource';
let RssSource = class RssSource {
    url;
    name;
    enabled;
    createdBy;
    lastImportedAt;
    lastError;
};
exports.RssSource = RssSource;
__decorate([
    (0, mongoose_1.Prop)({ type: String, required: true, unique: true, index: true }),
    __metadata("design:type", String)
], RssSource.prototype, "url", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String }),
    __metadata("design:type", String)
], RssSource.prototype, "name", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Boolean, default: true, index: true }),
    __metadata("design:type", Boolean)
], RssSource.prototype, "enabled", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, index: true }),
    __metadata("design:type", String)
], RssSource.prototype, "createdBy", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date }),
    __metadata("design:type", Date)
], RssSource.prototype, "lastImportedAt", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String }),
    __metadata("design:type", String)
], RssSource.prototype, "lastError", void 0);
exports.RssSource = RssSource = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], RssSource);
exports.RssSourceSchema = mongoose_1.SchemaFactory.createForClass(RssSource);
exports.RssSourceSchema.index({ enabled: 1, createdAt: -1 });
//# sourceMappingURL=rss-source.model.js.map