import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Model } from 'mongoose';
import { type OrderDocument } from '../models/order.model';
import { type ProductDocument } from '../models/product.model';
import { type ProductVariantDocument } from '../models/product-variant.model';
export declare class OrderReservationsWorkerService implements OnModuleInit, OnModuleDestroy {
    private readonly orderModel;
    private readonly productModel;
    private readonly variantModel;
    private readonly logger;
    private timer?;
    private isRunning;
    constructor(orderModel: Model<OrderDocument>, productModel: Model<ProductDocument>, variantModel: Model<ProductVariantDocument>);
    onModuleInit(): void;
    onModuleDestroy(): void;
    private tick;
    private cancelAndRelease;
}
