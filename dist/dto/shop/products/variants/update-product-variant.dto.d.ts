import { VariantOptionDto } from './create-product-variant.dto';
export declare class UpdateProductVariantDto {
    title?: string;
    skuCode?: string;
    options?: VariantOptionDto[];
    price?: number;
    stock?: number;
    status?: 'active' | 'inactive';
}
