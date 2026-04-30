export declare class QueryOrdersDto {
    page?: number;
    limit?: number;
    status?: 'pending_payment' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'cancelled_expired' | 'refunded';
}
