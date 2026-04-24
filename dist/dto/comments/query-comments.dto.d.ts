export declare class QueryCommentsDto {
    page: number;
    limit: number;
    sort: 'oldest' | 'newest';
    parentId?: string;
    topLevelOnly: boolean;
}
