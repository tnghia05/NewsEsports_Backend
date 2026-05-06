export declare class UpdatePostDto {
    title?: string;
    content?: string;
    thumbnailUrl?: string;
    game?: string;
    tournament?: string;
    tags?: string[];
    status?: 'draft' | 'published';
}
