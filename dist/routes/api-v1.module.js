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
const users_controller_1 = require("../controllers/users.controller");
const health_service_1 = require("../services/health.service");
const users_service_1 = require("../services/users.service");
const auth_service_1 = require("../services/auth.service");
const user_model_1 = require("../models/user.model");
const jwt_strategy_1 = require("../infra/auth/jwt.strategy");
let ApiV1Module = class ApiV1Module {
};
exports.ApiV1Module = ApiV1Module;
exports.ApiV1Module = ApiV1Module = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([{ name: user_model_1.UserModelName, schema: user_model_1.UserSchema }]),
        ],
        controllers: [health_controller_1.HealthController, auth_controller_1.AuthController, users_controller_1.UsersController],
        providers: [health_service_1.HealthService, users_service_1.UsersService, auth_service_1.AuthService, jwt_strategy_1.JwtStrategy],
    })
], ApiV1Module);
//# sourceMappingURL=api-v1.module.js.map