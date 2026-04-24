export declare class CreatePostDto {
    title: string;
    content: string;
    thumbnailUrl?: string;
    game: string;
    tournament?: string;
    tags?: string[];
    status: 'draft' | 'published';
}
