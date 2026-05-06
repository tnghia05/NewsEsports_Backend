import type { HydratedDocument } from 'mongoose';
export type OrderCounterDocument = HydratedDocument<OrderCounter>;
export declare const OrderCounterModelName = "OrderCounter";
export declare class OrderCounter {
    key: string;
    seq: number;
}
export declare const OrderCounterSchema: import("mongoose").Schema<OrderCounter, import("mongoose").Model<OrderCounter, any, any, any, any, any, OrderCounter>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, OrderCounter, import("mongoose").Document<unknown, {}, OrderCounter, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<OrderCounter & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    key?: import("mongoose").SchemaDefinitionProperty<string, OrderCounter, import("mongoose").Document<unknown, {}, OrderCounter, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<OrderCounter & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    seq?: import("mongoose").SchemaDefinitionProperty<number, OrderCounter, import("mongoose").Document<unknown, {}, OrderCounter, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<OrderCounter & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
}, OrderCounter>;
