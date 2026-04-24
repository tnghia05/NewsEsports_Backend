"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiV1Module = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const health_controller_1 = require("../controllers/health.controller");
const auth_controller_1 = require("../controllers/auth.controller");
const me_controller_1 = require("../controllers/me.controller");
const users_controller_1 = require("../controllers/users.controller");
const posts_controller_1 = require("../controllers/posts.controller");
const comments_controller_1 = require("../controllers/comments.controller");
const health_service_1 = require("../services/health.service");
const users_service_1 = require("../services/users.service");
const auth_service_1 = require("../services/auth.service");
const posts_service_1 = require("../services/posts.service");
const follows_service_1 = require("../services/follows.service");
const comments_service_1 = require("../services/comments.service");
const user_model_1 = require("../models/user.model");
const refresh_token_model_1 = require("../models/refresh-token.model");
const post_model_1 = require("../models/post.model");
const follow_model_1 = require("../models/follow.model");
const comment_model_1 = require("../models/comment.model");
const jwt_strategy_1 = require("../infra/auth/jwt.strategy");
let ApiV1Module = class ApiV1Module {
};
exports.ApiV1Module = ApiV1Module;
exports.ApiV1Module = ApiV1Module = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: user_model_1.UserModelName, schema: user_model_1.UserSchema },
                { name: refresh_token_model_1.RefreshTokenModelName, schema: refresh_token_model_1.RefreshTokenSchema },
                { name: post_model_1.PostModelName, schema: post_model_1.PostSchema },
                { name: follow_model_1.FollowModelName, schema: follow_model_1.FollowSchema },
                { name: comment_model_1.CommentModelName, schema: comment_model_1.CommentSchema },
            ]),
        ],
        controllers: [
            health_controller_1.HealthController,
            auth_controller_1.AuthController,
            me_controller_1.MeController,
            users_controller_1.UsersController,
            posts_controller_1.PostsController,
            comments_controller_1.CommentsController,
        ],
        providers: [
            health_service_1.HealthService,
            users_service_1.UsersService,
            auth_service_1.AuthService,
            posts_service_1.PostsService,
            follows_service_1.FollowsService,
            comments_service_1.CommentsService,
            jwt_strategy_1.JwtStrategy,
        ],
    })
], ApiV1Module);
//# sourceMappingURL=api-v1.module.js.map