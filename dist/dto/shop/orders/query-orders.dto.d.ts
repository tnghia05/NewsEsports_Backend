export declare class QueryOrdersDto {
    page?: number;
    limit?: number;
    status?: 'pending_payment' | 'paid' | 'cancelled' | 'refunded';
}
