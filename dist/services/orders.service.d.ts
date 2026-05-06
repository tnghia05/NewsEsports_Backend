import { Types, type Model } from 'mongoose';
import { type OrderCounterDocument } from '../models/order-counter.model';
import { type OrderDocument } from '../models/order.model';
import { type ProductDocument } from '../models/product.model';
import { type ProductVariantDocument } from '../models/product-variant.model';
import type { JwtUser } from '../types/auth';
import type { CreateOrderDto } from '../dto/shop/orders/create-order.dto';
import type { QueryOrdersDto } from '../dto/shop/orders/query-orders.dto';
import { OrderReservationsService } from './order-reservations.service';
export declare class OrdersService {
    private readonly orderModel;
    private readonly productModel;
    private readonly variantModel;
    private readonly orderCounterModel;
    private readonly reservations;
    constructor(orderModel: Model<OrderDocument>, productModel: Model<ProductDocument>, variantModel: Model<ProductVariantDocument>, orderCounterModel: Model<OrderCounterDocument>, reservations: OrderReservationsService);
    private adminMatchFromQuery;
    private auditEntry;
    create(user: JwtUser, dto: CreateOrderDto): Promise<import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, import("../models/order.model").Order, {}, import("mongoose").DefaultSchemaOptions> & import("../models/order.model").Order & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    }, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").Document<unknown, {}, import("../models/order.model").Order, {}, import("mongoose").DefaultSchemaOptions> & import("../models/order.model").Order & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    } & Required<{
        _id: Types.ObjectId;
    }>>;
    getAdmin(admin: JwtUser, orderRef: string): Promise<import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, import("../models/order.model").Order, {}, import("mongoose").DefaultSchemaOptions> & import("../models/order.model").Order & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    }, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").Document<unknown, {}, import("../models/order.model").Order, {}, import("mongoose").DefaultSchemaOptions> & import("../models/order.model").Order & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    } & Required<{
        _id: Types.ObjectId;
    }>>;
    listAdmin(admin: JwtUser, query: QueryOrdersDto): Promise<{
        items: (import("mongoose").Document<unknown, {}, import("../models/order.model").Order, {}, import("mongoose").DefaultSchemaOptions> & import("../models/order.model").Order & {
            _id: Types.ObjectId;
        } & {
            __v: number;
        } & {
            id: string;
        })[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    exportAdminCsv(admin: JwtUser, query: QueryOrdersDto): Promise<Buffer<ArrayBuffer>>;
    adminUpdateStatus(admin: JwtUser, orderRef: string, input: {
        status: any;
        trackingCode?: string;
    }): Promise<import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, import("../models/order.model").Order, {}, import("mongoose").DefaultSchemaOptions> & import("../models/order.model").Order & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    }, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").Document<unknown, {}, import("../models/order.model").Order, {}, import("mongoose").DefaultSchemaOptions> & import("../models/order.model").Order & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    } & Required<{
        _id: Types.ObjectId;
    }>>;
    adminSetInternalNotes(admin: JwtUser, orderRef: string, dto: {
        internalNotes?: string;
    }): Promise<import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, import("../models/order.model").Order, {}, import("mongoose").DefaultSchemaOptions> & import("../models/order.model").Order & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    }, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").Document<unknown, {}, import("../models/order.model").Order, {}, import("mongoose").DefaultSchemaOptions> & import("../models/order.model").Order & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    } & Required<{
        _id: Types.ObjectId;
    }>>;
    cancelMine(user: JwtUser, orderRef: string, reason?: string): Promise<import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, import("../models/order.model").Order, {}, import("mongoose").DefaultSchemaOptions> & import("../models/order.model").Order & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    }, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").Document<unknown, {}, import("../models/order.model").Order, {}, import("mongoose").DefaultSchemaOptions> & import("../models/order.model").Order & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    } & Required<{
        _id: Types.ObjectId;
    }>>;
    adminCancel(admin: JwtUser, orderRef: string, dto: {
        reason?: string;
        restoreStock?: boolean;
    }): Promise<import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, import("../models/order.model").Order, {}, import("mongoose").DefaultSchemaOptions> & import("../models/order.model").Order & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    }, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").Document<unknown, {}, import("../models/order.model").Order, {}, import("mongoose").DefaultSchemaOptions> & import("../models/order.model").Order & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    } & Required<{
        _id: Types.ObjectId;
    }>>;
    getMine(user: JwtUser, orderId: string): Promise<import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, import("../models/order.model").Order, {}, import("mongoose").DefaultSchemaOptions> & import("../models/order.model").Order & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    }, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").Document<unknown, {}, import("../models/order.model").Order, {}, import("mongoose").DefaultSchemaOptions> & import("../models/order.model").Order & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    } & Required<{
        _id: Types.ObjectId;
    }>>;
    listMine(user: JwtUser, query: QueryOrdersDto): Promise<{
        items: (import("mongoose").Document<unknown, {}, import("../models/order.model").Order, {}, import("mongoose").DefaultSchemaOptions> & import("../models/order.model").Order & {
            _id: Types.ObjectId;
        } & {
            __v: number;
        } & {
            id: string;
        })[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    private nextOrderCode;
}
