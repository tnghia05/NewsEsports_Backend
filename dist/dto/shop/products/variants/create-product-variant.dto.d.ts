export declare class VariantOptionDto {
    k: string;
    v: string;
}
export declare class CreateProductVariantDto {
    title: string;
    skuCode: string;
    options?: VariantOptionDto[];
    price: number;
    stock: number;
    status?: 'active' | 'inactive';
}
