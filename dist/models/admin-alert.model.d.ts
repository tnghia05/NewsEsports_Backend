import type { HydratedDocument } from 'mongoose';
export type AdminAlertDocument = HydratedDocument<AdminAlert>;
export declare const AdminAlertModelName = "AdminAlert";
export type AdminAlertType = 'toxicity_spike';
export declare class AdminAlert {
    type: AdminAlertType;
    tag: string;
    ratio3h: number;
    ratio24h: number;
    isRead: boolean;
}
export declare const AdminAlertSchema: import("mongoose").Schema<AdminAlert, import("mongoose").Model<AdminAlert, any, any, any, any, any, AdminAlert>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, AdminAlert, import("mongoose").Document<unknown, {}, AdminAlert, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<AdminAlert & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    type?: import("mongoose").SchemaDefinitionProperty<"toxicity_spike", AdminAlert, import("mongoose").Document<unknown, {}, AdminAlert, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AdminAlert & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    tag?: import("mongoose").SchemaDefinitionProperty<string, AdminAlert, import("mongoose").Document<unknown, {}, AdminAlert, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AdminAlert & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    ratio3h?: import("mongoose").SchemaDefinitionProperty<number, AdminAlert, import("mongoose").Document<unknown, {}, AdminAlert, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AdminAlert & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    ratio24h?: import("mongoose").SchemaDefinitionProperty<number, AdminAlert, import("mongoose").Document<unknown, {}, AdminAlert, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AdminAlert & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    isRead?: import("mongoose").SchemaDefinitionProperty<boolean, AdminAlert, import("mongoose").Document<unknown, {}, AdminAlert, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AdminAlert & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
}, AdminAlert>;
