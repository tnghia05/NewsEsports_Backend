export declare class AdminUpdateOrderStatusDto {
    status: 'pending_payment' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'cancelled_expired' | 'refunded';
    trackingCode?: string;
}
