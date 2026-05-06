import type { Model } from 'mongoose';
import { type OrderDocument } from '../models/order.model';
import { type ProductDocument } from '../models/product.model';
import { type ProductVariantDocument } from '../models/product-variant.model';
export declare class OrderReservationsService {
    private readonly orderModel;
    private readonly productModel;
    private readonly variantModel;
    private readonly logger;
    constructor(orderModel: Model<OrderDocument>, productModel: Model<ProductDocument>, variantModel: Model<ProductVariantDocument>);
    releasePendingReservationIfNeeded(orderId: any): Promise<boolean>;
    releasePendingReservationByTxnRef(txnRef: string): Promise<boolean>;
    markInventoryFinalizedIfNeeded(orderId: any): Promise<boolean>;
    restoreStockFromOrderItems(order: OrderDocument): Promise<void>;
}
