export declare class QueryNewsDto {
    page?: number;
    limit?: number;
    status?: 'published' | 'draft' | 'all';
    tag?: string;
    q?: string;
}
