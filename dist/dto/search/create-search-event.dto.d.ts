export declare class CreateSearchEventDto {
    q: string;
    action: 'search' | 'click';
    sessionId?: string;
    targetId?: string;
}
