export declare class QueryPostsDto {
    tab: 'latest' | 'hot' | 'following' | 'saved';
    page: number;
    limit: number;
    game?: string;
    tag?: string;
}
