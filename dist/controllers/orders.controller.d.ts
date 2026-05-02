import { StreamableFile } from '@nestjs/common';
import { OrdersService } from '../services/orders.service';
import type { JwtUser } from '../types/auth';
import { CreateOrderDto } from '../dto/shop/orders/create-order.dto';
import { QueryOrdersDto } from '../dto/shop/orders/query-orders.dto';
import { AdminUpdateOrderStatusDto } from '../dto/shop/orders/admin-update-order-status.dto';
import { CancelOrderDto } from '../dto/shop/orders/cancel-order.dto';
import { AdminCancelOrderDto } from '../dto/shop/orders/admin-cancel-order.dto';
import { AdminOrderNotesDto } from '../dto/shop/orders/admin-order-notes.dto';
export declare class OrdersController {
    private readonly ordersService;
    constructor(ordersService: OrdersService);
    listAdmin(admin: JwtUser, query: QueryOrdersDto): Promise<{
        items: (import("mongoose").Document<unknown, {}, import("../models/order.model").Order, {}, import("mongoose").DefaultSchemaOptions> & import("../models/order.model").Order & {
            _id: import("mongoose").Types.ObjectId;
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
    exportAdminCsv(admin: JwtUser, query: QueryOrdersDto): Promise<StreamableFile>;
    getAdmin(admin: JwtUser, orderRef: string): Promise<import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, import("../models/order.model").Order, {}, import("mongoose").DefaultSchemaOptions> & import("../models/order.model").Order & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    }, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").Document<unknown, {}, import("../models/order.model").Order, {}, import("mongoose").DefaultSchemaOptions> & import("../models/order.model").Order & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    } & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>>;
    updateStatus(admin: JwtUser, orderRef: string, dto: AdminUpdateOrderStatusDto): Promise<import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, import("../models/order.model").Order, {}, import("mongoose").DefaultSchemaOptions> & import("../models/order.model").Order & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    }, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").Document<unknown, {}, import("../models/order.model").Order, {}, import("mongoose").DefaultSchemaOptions> & import("../models/order.model").Order & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    } & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>>;
    adminCancel(admin: JwtUser, orderRef: string, dto: AdminCancelOrderDto): Promise<import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, import("../models/order.model").Order, {}, import("mongoose").DefaultSchemaOptions> & import("../models/order.model").Order & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    }, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").Document<unknown, {}, import("../models/order.model").Order, {}, import("mongoose").DefaultSchemaOptions> & import("../models/order.model").Order & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    } & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>>;
    adminNotes(admin: JwtUser, orderRef: string, dto: AdminOrderNotesDto): Promise<import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, import("../models/order.model").Order, {}, import("mongoose").DefaultSchemaOptions> & import("../models/order.model").Order & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    }, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").Document<unknown, {}, import("../models/order.model").Order, {}, import("mongoose").DefaultSchemaOptions> & import("../models/order.model").Order & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    } & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>>;
    create(user: JwtUser, dto: CreateOrderDto): Promise<import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, import("../models/order.model").Order, {}, import("mongoose").DefaultSchemaOptions> & import("../models/order.model").Order & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    }, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").Document<unknown, {}, import("../models/order.model").Order, {}, import("mongoose").DefaultSchemaOptions> & import("../models/order.model").Order & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    } & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>>;
    listMine(user: JwtUser, query: QueryOrdersDto): Promise<{
        items: (import("mongoose").Document<unknown, {}, import("../models/order.model").Order, {}, import("mongoose").DefaultSchemaOptions> & import("../models/order.model").Order & {
            _id: import("mongoose").Types.ObjectId;
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
    getMine(user: JwtUser, id: string): Promise<import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, import("../models/order.model").Order, {}, import("mongoose").DefaultSchemaOptions> & import("../models/order.model").Order & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    }, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").Document<unknown, {}, import("../models/order.model").Order, {}, import("mongoose").DefaultSchemaOptions> & import("../models/order.model").Order & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    } & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>>;
    cancelMine(user: JwtUser, id: string, dto: CancelOrderDto): Promise<import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, import("../models/order.model").Order, {}, import("mongoose").DefaultSchemaOptions> & import("../models/order.model").Order & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    }, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").Document<unknown, {}, import("../models/order.model").Order, {}, import("mongoose").DefaultSchemaOptions> & import("../models/order.model").Order & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    } & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>>;
}
