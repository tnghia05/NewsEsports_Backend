export declare class UpdateNewsDto {
    title?: string;
    slug?: string;
    excerpt?: string;
    content?: string;
    coverImageUrl?: string;
    tags?: string[];
    status?: 'draft' | 'published';
}
