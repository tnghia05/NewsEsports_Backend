import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Model } from 'mongoose';
import { type OrderDocument } from '../models/order.model';
import { OrderReservationsService } from './order-reservations.service';
export declare class OrderReservationsWorkerService implements OnModuleInit, OnModuleDestroy {
    private readonly orderModel;
    private readonly reservations;
    private readonly logger;
    private timer?;
    private isRunning;
    constructor(orderModel: Model<OrderDocument>, reservations: OrderReservationsService);
    onModuleInit(): void;
    onModuleDestroy(): void;
    private tick;
    private cancelAndRelease;
}
