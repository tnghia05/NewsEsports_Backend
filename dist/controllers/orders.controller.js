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
exports.OrdersController = void 0;
const common_1 = require("@nestjs/common");
const orders_service_1 = require("../services/orders.service");
const jwt_auth_guard_1 = require("../guards/jwt-auth.guard");
const roles_guard_1 = require("../guards/roles.guard");
const roles_decorator_1 = require("../decorators/roles.decorator");
const user_decorator_1 = require("../decorators/user.decorator");
const create_order_dto_1 = require("../dto/shop/orders/create-order.dto");
const query_orders_dto_1 = require("../dto/shop/orders/query-orders.dto");
const admin_update_order_status_dto_1 = require("../dto/shop/orders/admin-update-order-status.dto");
const cancel_order_dto_1 = require("../dto/shop/orders/cancel-order.dto");
const admin_cancel_order_dto_1 = require("../dto/shop/orders/admin-cancel-order.dto");
const admin_order_notes_dto_1 = require("../dto/shop/orders/admin-order-notes.dto");
let OrdersController = class OrdersController {
    ordersService;
    constructor(ordersService) {
        this.ordersService = ordersService;
    }
    listAdmin(admin, query) {
        return this.ordersService.listAdmin(admin, query);
    }
    async exportAdminCsv(admin, query) {
        const buf = await this.ordersService.exportAdminCsv(admin, query);
        return new common_1.StreamableFile(buf, {
            type: 'text/csv; charset=utf-8',
            disposition: `attachment; filename="orders.csv"`,
        });
    }
    getAdmin(admin, orderRef) {
        return this.ordersService.getAdmin(admin, orderRef);
    }
    updateStatus(admin, orderRef, dto) {
        return this.ordersService.adminUpdateStatus(admin, orderRef, dto);
    }
    adminCancel(admin, orderRef, dto) {
        return this.ordersService.adminCancel(admin, orderRef, dto);
    }
    adminNotes(admin, orderRef, dto) {
        return this.ordersService.adminSetInternalNotes(admin, orderRef, dto);
    }
    create(user, dto) {
        return this.ordersService.create(user, dto);
    }
    listMine(user, query) {
        return this.ordersService.listMine(user, query);
    }
    getMine(user, id) {
        return this.ordersService.getMine(user, id);
    }
    cancelMine(user, id, dto) {
        return this.ordersService.cancelMine(user, id, dto.reason);
    }
};
exports.OrdersController = OrdersController;
__decorate([
    (0, common_1.Get)('admin/list'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    __param(0, (0, user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, query_orders_dto_1.QueryOrdersDto]),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "listAdmin", null);
__decorate([
    (0, common_1.Get)('admin/export.csv'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    __param(0, (0, user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, query_orders_dto_1.QueryOrdersDto]),
    __metadata("design:returntype", Promise)
], OrdersController.prototype, "exportAdminCsv", null);
__decorate([
    (0, common_1.Get)('admin/:orderRef'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    __param(0, (0, user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('orderRef')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "getAdmin", null);
__decorate([
    (0, common_1.Patch)('admin/:orderRef/status'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    __param(0, (0, user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('orderRef')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, admin_update_order_status_dto_1.AdminUpdateOrderStatusDto]),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "updateStatus", null);
__decorate([
    (0, common_1.Patch)('admin/:orderRef/cancel'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    __param(0, (0, user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('orderRef')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, admin_cancel_order_dto_1.AdminCancelOrderDto]),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "adminCancel", null);
__decorate([
    (0, common_1.Patch)('admin/:orderRef/notes'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    __param(0, (0, user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('orderRef')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, admin_order_notes_dto_1.AdminOrderNotesDto]),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "adminNotes", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_order_dto_1.CreateOrderDto]),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('me'),
    __param(0, (0, user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, query_orders_dto_1.QueryOrdersDto]),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "listMine", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "getMine", null);
__decorate([
    (0, common_1.Patch)(':id/cancel'),
    __param(0, (0, user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, cancel_order_dto_1.CancelOrderDto]),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "cancelMine", null);
exports.OrdersController = OrdersController = __decorate([
    (0, common_1.Controller)('orders'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [orders_service_1.OrdersService])
], OrdersController);
//# sourceMappingURL=orders.controller.js.map