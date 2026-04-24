export declare class QueryPostsDto {
    tab: 'latest' | 'hot' | 'following';
    page: number;
    limit: number;
    game?: string;
    tag?: string;
}
