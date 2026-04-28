import { Types, type HydratedDocument } from 'mongoose';
export type OrderDocument = HydratedDocument<Order>;
export declare const OrderModelName = "Order";
export type OrderStatus = 'pending_payment' | 'paid' | 'cancelled' | 'refunded';
export type OrderPaymentProvider = 'vnpay';
export declare class OrderItemSnapshot {
    productId: Types.ObjectId;
    name: string;
    slug: string;
    unitPrice: number;
    qty: number;
    lineTotal: number;
}
export declare class OrderPaymentSnapshot {
    provider: OrderPaymentProvider;
    providerTxnRef?: string;
    vnp_TxnRef?: string;
    vnp_TransactionNo?: string;
    vnp_BankCode?: string;
    vnp_ResponseCode?: string;
    vnp_TransactionStatus?: string;
    vnp_PayDate?: string;
    paidAt?: string;
}
export declare class Order {
    userId: Types.ObjectId;
    orderCode: string;
    items: OrderItemSnapshot[];
    subtotal: number;
    shippingFee: number;
    total: number;
    status: OrderStatus;
    payment?: OrderPaymentSnapshot;
}
export declare const OrderSchema: import("mongoose").Schema<Order, import("mongoose").Model<Order, any, any, any, any, any, Order>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Order, import("mongoose").Document<unknown, {}, Order, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<Order & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    userId?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId, Order, import("mongoose").Document<unknown, {}, Order, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Order & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    orderCode?: import("mongoose").SchemaDefinitionProperty<string, Order, import("mongoose").Document<unknown, {}, Order, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Order & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    items?: import("mongoose").SchemaDefinitionProperty<OrderItemSnapshot[], Order, import("mongoose").Document<unknown, {}, Order, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Order & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    subtotal?: import("mongoose").SchemaDefinitionProperty<number, Order, import("mongoose").Document<unknown, {}, Order, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Order & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    shippingFee?: import("mongoose").SchemaDefinitionProperty<number, Order, import("mongoose").Document<unknown, {}, Order, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Order & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    total?: import("mongoose").SchemaDefinitionProperty<number, Order, import("mongoose").Document<unknown, {}, Order, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Order & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    status?: import("mongoose").SchemaDefinitionProperty<OrderStatus, Order, import("mongoose").Document<unknown, {}, Order, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Order & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    payment?: import("mongoose").SchemaDefinitionProperty<OrderPaymentSnapshot | undefined, Order, import("mongoose").Document<unknown, {}, Order, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Order & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
}, Order>;
