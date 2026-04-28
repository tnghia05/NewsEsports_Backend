import type { Model } from 'mongoose';
import type { JwtUser } from '../types/auth';
import { type ProductDocument } from '../models/product.model';
import type { CreateProductDto } from '../dto/shop/products/create-product.dto';
import type { UpdateProductDto } from '../dto/shop/products/update-product.dto';
import type { QueryProductsDto } from '../dto/shop/products/query-products.dto';
export declare class ProductsService {
    private readonly productModel;
    constructor(productModel: Model<ProductDocument>);
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
    getById(id: string): Promise<import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, import("../models/product.model").Product, {}, import("mongoose").DefaultSchemaOptions> & import("../models/product.model").Product & {
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
}
