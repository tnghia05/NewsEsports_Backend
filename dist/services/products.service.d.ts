import type { Model } from 'mongoose';
import type { JwtUser } from '../types/auth';
import { type ProductDocument, type ProductStatus } from '../models/product.model';
import { type ProductVariantDocument } from '../models/product-variant.model';
import type { CreateProductDto } from '../dto/shop/products/create-product.dto';
import type { UpdateProductDto } from '../dto/shop/products/update-product.dto';
import type { QueryProductsDto } from '../dto/shop/products/query-products.dto';
import type { CreateProductVariantDto } from '../dto/shop/products/variants/create-product-variant.dto';
import type { UpdateProductVariantDto } from '../dto/shop/products/variants/update-product-variant.dto';
export declare class ProductsService {
    private readonly productModel;
    private readonly variantModel;
    constructor(productModel: Model<ProductDocument>, variantModel: Model<ProductVariantDocument>);
    create(admin: JwtUser, dto: CreateProductDto): Promise<import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, import("../models/product.model").Product, {}, import("mongoose").DefaultSchemaOptions> & import("../models/product.model").Product & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    }, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").Document<unknown, {}, import("../models/product.model").Product, {}, import("mongoose").DefaultSchemaOptions> & import("../models/product.model").Product & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    } & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>>;
    update(admin: JwtUser, id: string, dto: UpdateProductDto): Promise<import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, import("../models/product.model").Product, {}, import("mongoose").DefaultSchemaOptions> & import("../models/product.model").Product & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    }, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").Document<unknown, {}, import("../models/product.model").Product, {}, import("mongoose").DefaultSchemaOptions> & import("../models/product.model").Product & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    } & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>>;
    remove(admin: JwtUser, id: string): Promise<{
        ok: boolean;
    }>;
    getById(id: string): Promise<{
        variants: (import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, import("../models/product-variant.model").ProductVariant, {}, import("mongoose").DefaultSchemaOptions> & import("../models/product-variant.model").ProductVariant & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        } & {
            id: string;
        }, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").Document<unknown, {}, import("../models/product-variant.model").ProductVariant, {}, import("mongoose").DefaultSchemaOptions> & import("../models/product-variant.model").ProductVariant & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        } & {
            id: string;
        } & Required<{
            _id: import("mongoose").Types.ObjectId;
        }>)[];
        _id: import("mongoose").Types.ObjectId;
        $locals: Record<string, unknown>;
        $op: "save" | "validate" | "remove" | null;
        $where: Record<string, unknown>;
        baseModelName?: string;
        collection: import("mongoose").Collection;
        db: import("mongoose").Connection;
        errors?: import("mongoose").Error.ValidationError;
        isNew: boolean;
        schema: import("mongoose").Schema;
        name: string;
        slug: string;
        description?: string;
        imageUrls: string[];
        type: import("../models/product.model").ProductType;
        price: number;
        stock: number;
        reserved: number;
        status: ProductStatus;
        tags: string[];
        pointsPrice?: number;
        __v: number;
        id: string;
    }>;
    listPublic(query: QueryProductsDto): Promise<{
        items: (import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, import("../models/product.model").Product, {}, import("mongoose").DefaultSchemaOptions> & import("../models/product.model").Product & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        } & {
            id: string;
        }, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").Document<unknown, {}, import("../models/product.model").Product, {}, import("mongoose").DefaultSchemaOptions> & import("../models/product.model").Product & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        } & {
            id: string;
        } & Required<{
            _id: import("mongoose").Types.ObjectId;
        }>)[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    listAdmin(admin: JwtUser, query: QueryProductsDto): Promise<{
        items: (import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, import("../models/product.model").Product, {}, import("mongoose").DefaultSchemaOptions> & import("../models/product.model").Product & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        } & {
            id: string;
        }, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").Document<unknown, {}, import("../models/product.model").Product, {}, import("mongoose").DefaultSchemaOptions> & import("../models/product.model").Product & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        } & {
            id: string;
        } & Required<{
            _id: import("mongoose").Types.ObjectId;
        }>)[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    requireProduct(id: string): Promise<import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, import("../models/product.model").Product, {}, import("mongoose").DefaultSchemaOptions> & import("../models/product.model").Product & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    }, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").Document<unknown, {}, import("../models/product.model").Product, {}, import("mongoose").DefaultSchemaOptions> & import("../models/product.model").Product & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    } & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>>;
    listVariantsPublic(productId: string): Promise<(import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, import("../models/product-variant.model").ProductVariant, {}, import("mongoose").DefaultSchemaOptions> & import("../models/product-variant.model").ProductVariant & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    }, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").Document<unknown, {}, import("../models/product-variant.model").ProductVariant, {}, import("mongoose").DefaultSchemaOptions> & import("../models/product-variant.model").ProductVariant & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    } & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>)[]>;
    listVariantsAdmin(admin: JwtUser, productId: string): Promise<(import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, import("../models/product-variant.model").ProductVariant, {}, import("mongoose").DefaultSchemaOptions> & import("../models/product-variant.model").ProductVariant & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    }, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").Document<unknown, {}, import("../models/product-variant.model").ProductVariant, {}, import("mongoose").DefaultSchemaOptions> & import("../models/product-variant.model").ProductVariant & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    } & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>)[]>;
    createVariant(admin: JwtUser, productId: string, dto: CreateProductVariantDto): Promise<import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, import("../models/product-variant.model").ProductVariant, {}, import("mongoose").DefaultSchemaOptions> & import("../models/product-variant.model").ProductVariant & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    }, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").Document<unknown, {}, import("../models/product-variant.model").ProductVariant, {}, import("mongoose").DefaultSchemaOptions> & import("../models/product-variant.model").ProductVariant & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    } & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>>;
    updateVariant(admin: JwtUser, variantId: string, dto: UpdateProductVariantDto): Promise<import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, import("../models/product-variant.model").ProductVariant, {}, import("mongoose").DefaultSchemaOptions> & import("../models/product-variant.model").ProductVariant & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    }, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").Document<unknown, {}, import("../models/product-variant.model").ProductVariant, {}, import("mongoose").DefaultSchemaOptions> & import("../models/product-variant.model").ProductVariant & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    } & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>>;
    removeVariant(admin: JwtUser, variantId: string): Promise<{
        ok: boolean;
    }>;
}
