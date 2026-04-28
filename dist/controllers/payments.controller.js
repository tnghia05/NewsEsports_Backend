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
exports.PaymentsController = void 0;
const common_1 = require("@nestjs/common");
const payments_service_1 = require("../services/payments.service");
const jwt_auth_guard_1 = require("../guards/jwt-auth.guard");
const user_decorator_1 = require("../decorators/user.decorator");
const vnpay_create_payment_url_dto_1 = require("../dto/shop/payments/vnpay-create-payment-url.dto");
let PaymentsController = class PaymentsController {
    paymentsService;
    constructor(paymentsService) {
        this.paymentsService = paymentsService;
    }
    async createVNPayUrl(user, orderId, dto, req) {
        void user;
        const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
            req.ip ||
            req.socket.remoteAddress ||
            '127.0.0.1';
        return this.paymentsService.createVNPayPaymentUrl(orderId, dto, ip);
    }
    verifyReturn(query) {
        return this.paymentsService.verifyVNPayReturn(query);
    }
    ipn(query) {
        return this.paymentsService.handleVNPayIpn(query);
    }
};
exports.PaymentsController = PaymentsController;
__decorate([
    (0, common_1.Post)('vnpay/orders/:orderId/url'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('orderId')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, vnpay_create_payment_url_dto_1.VNPayCreatePaymentUrlDto, Object]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "createVNPayUrl", null);
__decorate([
    (0, common_1.Get)('vnpay/return'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], PaymentsController.prototype, "verifyReturn", null);
__decorate([
    (0, common_1.Get)('vnpay/ipn'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], PaymentsController.prototype, "ipn", null);
exports.PaymentsController = PaymentsController = __decorate([
    (0, common_1.Controller)('payments'),
    __metadata("design:paramtypes", [payments_service_1.PaymentsService])
], PaymentsController);
//# sourceMappingURL=payments.controller.js.map