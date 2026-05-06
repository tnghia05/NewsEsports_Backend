export declare class QueryUserPostsDto {
    page: number;
    limit: number;
    status?: 'published' | 'draft' | 'all';
    game?: string;
    tag?: string;
}
