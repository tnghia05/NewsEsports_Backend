export declare class CreateOrderItemDto {
    productId: string;
    variantId?: string;
    qty: number;
}
export declare class CreateOrderDto {
    items: CreateOrderItemDto[];
    receiverName?: string;
    phone?: string;
    email?: string;
    shippingAddress?: string;
    shippingMethod?: string;
}
