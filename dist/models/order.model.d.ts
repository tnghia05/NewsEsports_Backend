import { Types, type HydratedDocument } from 'mongoose';
export type OrderDocument = HydratedDocument<Order>;
export declare const OrderModelName = "Order";
export type OrderStatus = 'pending_payment' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'cancelled_expired' | 'refunded';
export type OrderPaymentProvider = 'vnpay';
export declare class OrderItemSnapshot {
    productId: Types.ObjectId;
    variantId?: Types.ObjectId;
    name: string;
    slug: string;
    variantTitle?: string;
    skuCode?: string;
    variantOptions?: Array<{
        k: string;
        v: string;
    }>;
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
export declare class OrderAuditEntry {
    at: Date;
    actorId: Types.ObjectId;
    actorRole: string;
    action: string;
    message?: string;
    meta?: Record<string, unknown>;
}
export declare class Order {
    userId: Types.ObjectId;
    orderCode: string;
    items: OrderItemSnapshot[];
    receiverName?: string;
    receiverPhone?: string;
    receiverEmail?: string;
    shippingAddress?: string;
    shippingMethod?: string;
    trackingCode?: string;
    reservationReleased: boolean;
    inventoryFinalized: boolean;
    cancelReason?: string;
    cancelledAt?: Date;
    internalNotes?: string;
    auditLog: OrderAuditEntry[];
    reservedUntil?: Date;
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
    receiverName?: import("mongoose").SchemaDefinitionProperty<string | undefined, Order, import("mongoose").Document<unknown, {}, Order, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Order & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    receiverPhone?: import("mongoose").SchemaDefinitionProperty<string | undefined, Order, import("mongoose").Document<unknown, {}, Order, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Order & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    receiverEmail?: import("mongoose").SchemaDefinitionProperty<string | undefined, Order, import("mongoose").Document<unknown, {}, Order, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Order & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    shippingAddress?: import("mongoose").SchemaDefinitionProperty<string | undefined, Order, import("mongoose").Document<unknown, {}, Order, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Order & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    shippingMethod?: import("mongoose").SchemaDefinitionProperty<string | undefined, Order, import("mongoose").Document<unknown, {}, Order, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Order & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    trackingCode?: import("mongoose").SchemaDefinitionProperty<string | undefined, Order, import("mongoose").Document<unknown, {}, Order, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Order & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    reservationReleased?: import("mongoose").SchemaDefinitionProperty<boolean, Order, import("mongoose").Document<unknown, {}, Order, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Order & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    inventoryFinalized?: import("mongoose").SchemaDefinitionProperty<boolean, Order, import("mongoose").Document<unknown, {}, Order, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Order & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    cancelReason?: import("mongoose").SchemaDefinitionProperty<string | undefined, Order, import("mongoose").Document<unknown, {}, Order, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Order & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    cancelledAt?: import("mongoose").SchemaDefinitionProperty<Date | undefined, Order, import("mongoose").Document<unknown, {}, Order, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Order & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    internalNotes?: import("mongoose").SchemaDefinitionProperty<string | undefined, Order, import("mongoose").Document<unknown, {}, Order, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Order & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    auditLog?: import("mongoose").SchemaDefinitionProperty<OrderAuditEntry[], Order, import("mongoose").Document<unknown, {}, Order, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Order & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    reservedUntil?: import("mongoose").SchemaDefinitionProperty<Date | undefined, Order, import("mongoose").Document<unknown, {}, Order, {
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
