export declare class UpdateProductDto {
    name?: string;
    slug?: string;
    description?: string;
    imageUrls?: string[];
    price?: number;
    stock?: number;
    status?: 'active' | 'inactive';
    tags?: string[];
}
