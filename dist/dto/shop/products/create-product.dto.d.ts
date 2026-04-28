export declare class CreateProductDto {
    name: string;
    slug: string;
    description?: string;
    imageUrls?: string[];
    price: number;
    stock: number;
    status?: 'active' | 'inactive';
    tags?: string[];
}
