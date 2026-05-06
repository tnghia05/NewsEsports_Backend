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
exports.HealthService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const comment_moderation_job_model_1 = require("../models/comment-moderation-job.model");
const comment_model_1 = require("../models/comment.model");
let HealthService = class HealthService {
    commentModel;
    jobModel;
    constructor(commentModel, jobModel) {
        this.commentModel = commentModel;
        this.jobModel = jobModel;
    }
    async getHealth() {
        const [pending, approved, rejected] = await Promise.all([
            this.commentModel.countDocuments({ moderationStatus: 'pending' }).exec(),
            this.commentModel.countDocuments({ moderationStatus: 'approved' }).exec(),
            this.commentModel.countDocuments({ moderationStatus: 'rejected' }).exec(),
        ]);
        const [jobsPending, jobsFailed] = await Promise.all([
            this.jobModel.countDocuments({ status: 'pending' }).exec(),
            this.jobModel.countDocuments({ status: 'failed' }).exec(),
        ]);
        return {
            status: 'ok',
            timestamp: new Date().toISOString(),
            moderation: {
                comments: { pending, approved, rejected },
                jobs: { pending: jobsPending, failed: jobsFailed },
            },
        };
    }
};
exports.HealthService = HealthService;
exports.HealthService = HealthService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(comment_model_1.CommentModelName)),
    __param(1, (0, mongoose_1.InjectModel)(comment_moderation_job_model_1.CommentModerationJobModelName)),
    __metadata("design:paramtypes", [Function, Function])
], HealthService);
//# sourceMappingURL=health.service.js.map