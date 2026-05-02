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
var OrderReservationsWorkerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderReservationsWorkerService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const order_model_1 = require("../models/order.model");
const order_reservations_service_1 = require("./order-reservations.service");
let OrderReservationsWorkerService = OrderReservationsWorkerService_1 = class OrderReservationsWorkerService {
    orderModel;
    reservations;
    logger = new common_1.Logger(OrderReservationsWorkerService_1.name);
    timer;
    isRunning = false;
    constructor(orderModel, reservations) {
        this.orderModel = orderModel;
        this.reservations = reservations;
    }
    onModuleInit() {
        this.timer = setInterval(() => void this.tick(), 60_000);
        setTimeout(() => void this.tick(), 5_000);
        this.logger.log('Reservation worker started (interval=60s)');
    }
    onModuleDestroy() {
        if (this.timer)
            clearInterval(this.timer);
    }
    async tick() {
        if (this.isRunning)
            return;
        this.isRunning = true;
        const started = Date.now();
        try {
            const now = new Date();
            const expired = await this.orderModel
                .find({
                status: 'pending_payment',
                reservedUntil: { $exists: true, $lt: now },
            })
                .limit(50)
                .exec();
            let cancelled = 0;
            for (const order of expired) {
                const did = await this.cancelAndRelease(order._id, now);
                if (did)
                    cancelled += 1;
            }
            if (expired.length) {
                this.logger.log(`reservation_tick scanned=${expired.length} cancelled=${cancelled} ms=${Date.now() - started}`);
            }
        }
        catch (e) {
            this.logger.error(`reservation tick failed: ${String(e?.message ?? e)} ms=${Date.now() - started}`);
        }
        finally {
            this.isRunning = false;
        }
    }
    async cancelAndRelease(orderId, now) {
        const cancelled = await this.orderModel
            .findOneAndUpdate({ _id: orderId, status: 'pending_payment', reservedUntil: { $lt: now } }, { $set: { status: 'cancelled_expired' } }, { returnDocument: 'after' })
            .exec();
        if (!cancelled)
            return false;
        await this.reservations.releasePendingReservationIfNeeded(cancelled._id);
        this.logger.log(`released expired reservation order=${String(cancelled.orderCode)} id=${String(cancelled._id)}`);
        return true;
    }
};
exports.OrderReservationsWorkerService = OrderReservationsWorkerService;
exports.OrderReservationsWorkerService = OrderReservationsWorkerService = OrderReservationsWorkerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(order_model_1.OrderModelName)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        order_reservations_service_1.OrderReservationsService])
], OrderReservationsWorkerService);
//# sourceMappingURL=order-reservations-worker.service.js.map