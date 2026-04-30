export declare class UpdateProductDto {
    name?: string;
    slug?: string;
    description?: string;
    imageUrls?: string[];
    price?: number;
    stock?: number;
    type?: 'physical' | 'digital' | 'ticket' | 'service';
    status?: 'active' | 'inactive';
    tags?: string[];
}
