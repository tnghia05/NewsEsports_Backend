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
exports.PostSavesService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const post_save_model_1 = require("../models/post-save.model");
const post_model_1 = require("../models/post.model");
const assert_can_read_post_1 = require("../utils/assert-can-read-post");
let PostSavesService = class PostSavesService {
    postSaveModel;
    postModel;
    constructor(postSaveModel, postModel) {
        this.postSaveModel = postSaveModel;
        this.postModel = postModel;
    }
    async toggleSave(viewer, postId) {
        const post = await this.postModel.findById(postId).exec();
        if (!post)
            throw new common_1.NotFoundException('Post not found');
        (0, assert_can_read_post_1.assertCanReadPost)(viewer, post);
        const existing = await this.postSaveModel
            .findOne({ postId, userId: viewer.id })
            .exec();
        if (existing) {
            await existing.deleteOne();
            return { saved: false };
        }
        try {
            await this.postSaveModel.create({ postId, userId: viewer.id });
        }
        catch {
            return { saved: true };
        }
        return { saved: true };
    }
};
exports.PostSavesService = PostSavesService;
exports.PostSavesService = PostSavesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(post_save_model_1.PostSaveModelName)),
    __param(1, (0, mongoose_1.InjectModel)(post_model_1.PostModelName)),
    __metadata("design:paramtypes", [Function, Function])
], PostSavesService);
//# sourceMappingURL=post-saves.service.js.map