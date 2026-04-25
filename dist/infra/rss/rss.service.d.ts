export type RssItem = {
    title: string;
    link: string;
    guid?: string;
    publishedAt?: Date;
    content?: string;
};
export declare class RssService {
    private readonly logger;
    private readonly parser;
    fetchFeed(url: string): Promise<RssItem[]>;
}
