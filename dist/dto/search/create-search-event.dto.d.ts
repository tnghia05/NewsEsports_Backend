export declare class CreateSearchEventDto {
    q: string;
    action: 'search' | 'click';
    sessionId?: string;
    targetType?: 'post' | 'comment' | 'news' | 'user' | 'other';
    targetId?: string;
}
