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
exports.NewsSchema = exports.News = exports.NewsModelName = void 0;
const mongoose_1 = require("@nestjs/mongoose");
exports.NewsModelName = 'News';
let News = class News {
    title;
    slug;
    excerpt;
    content;
    coverImageUrl;
    tags;
    status;
    publishedAt;
    source;
    authorId;
    sourceUrl;
    externalUrl;
    externalId;
};
exports.News = News;
__decorate([
    (0, mongoose_1.Prop)({ type: String, required: true }),
    __metadata("design:type", String)
], News.prototype, "title", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, required: true, unique: true, index: true }),
    __metadata("design:type", String)
], News.prototype, "slug", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String }),
    __metadata("design:type", String)
], News.prototype, "excerpt", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, required: true }),
    __metadata("design:type", String)
], News.prototype, "content", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String }),
    __metadata("design:type", String)
], News.prototype, "coverImageUrl", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [String], default: [], index: true }),
    __metadata("design:type", Array)
], News.prototype, "tags", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, enum: ['draft', 'published'], default: 'draft', index: true }),
    __metadata("design:type", String)
], News.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date, index: true }),
    __metadata("design:type", Date)
], News.prototype, "publishedAt", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, enum: ['admin', 'rss'], default: 'admin', index: true }),
    __metadata("design:type", String)
], News.prototype, "source", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, index: true }),
    __metadata("design:type", String)
], News.prototype, "authorId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, index: true }),
    __metadata("design:type", String)
], News.prototype, "sourceUrl", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, index: true }),
    __metadata("design:type", String)
], News.prototype, "externalUrl", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, index: true }),
    __metadata("design:type", String)
], News.prototype, "externalId", void 0);
exports.News = News = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], News);
exports.NewsSchema = mongoose_1.SchemaFactory.createForClass(News);
exports.NewsSchema.index({ status: 1, publishedAt: -1, createdAt: -1 });
exports.NewsSchema.index({ source: 1, externalId: 1 }, { unique: true, sparse: true });
exports.NewsSchema.index({ source: 1, externalUrl: 1 }, { unique: true, sparse: true });
//# sourceMappingURL=news.model.js.map