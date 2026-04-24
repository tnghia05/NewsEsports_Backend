export declare class SearchPostsDto {
    q?: string;
    game?: string;
    tag?: string;
    tab: 'latest' | 'hot';
    page: number;
    limit: number;
}
