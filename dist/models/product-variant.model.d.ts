import { Types, type HydratedDocument } from 'mongoose';
export type ProductVariantDocument = HydratedDocument<ProductVariant>;
export declare const ProductVariantModelName = "ProductVariant";
export type ProductVariantStatus = 'active' | 'inactive';
export declare class VariantOption {
    k: string;
    v: string;
}
export declare class ProductVariant {
    productId: Types.ObjectId;
    title: string;
    skuCode: string;
    options: VariantOption[];
    price: number;
    stock: number;
    reserved: number;
    status: ProductVariantStatus;
}
export declare const ProductVariantSchema: import("mongoose").Schema<ProductVariant, import("mongoose").Model<ProductVariant, any, any, any, any, any, ProductVariant>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, ProductVariant, import("mongoose").Document<unknown, {}, ProductVariant, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<ProductVariant & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    productId?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId, ProductVariant, import("mongoose").Document<unknown, {}, ProductVariant, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<ProductVariant & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    title?: import("mongoose").SchemaDefinitionProperty<string, ProductVariant, import("mongoose").Document<unknown, {}, ProductVariant, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<ProductVariant & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    skuCode?: import("mongoose").SchemaDefinitionProperty<string, ProductVariant, import("mongoose").Document<unknown, {}, ProductVariant, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<ProductVariant & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    options?: import("mongoose").SchemaDefinitionProperty<VariantOption[], ProductVariant, import("mongoose").Document<unknown, {}, ProductVariant, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<ProductVariant & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    price?: import("mongoose").SchemaDefinitionProperty<number, ProductVariant, import("mongoose").Document<unknown, {}, ProductVariant, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<ProductVariant & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    stock?: import("mongoose").SchemaDefinitionProperty<number, ProductVariant, import("mongoose").Document<unknown, {}, ProductVariant, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<ProductVariant & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    reserved?: import("mongoose").SchemaDefinitionProperty<number, ProductVariant, import("mongoose").Document<unknown, {}, ProductVariant, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<ProductVariant & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    status?: import("mongoose").SchemaDefinitionProperty<ProductVariantStatus, ProductVariant, import("mongoose").Document<unknown, {}, ProductVariant, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<ProductVariant & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
}, ProductVariant>;
