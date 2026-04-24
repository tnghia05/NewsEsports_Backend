import type { Model } from 'mongoose';
import { type PostDocument } from '../models/post.model';
export declare class HashtagsService {
    private readonly postModel;
    constructor(postModel: Model<PostDocument>);
    listPostsByTag(tag: string, opts: {
        tab: 'latest' | 'hot';
        page: number;
        limit: number;
    }): Promise<{
        items: any[];
        page: number;
        limit: number;
    }>;
    trending(window: '24h' | '7d'): Promise<{
        window: "24h" | "7d";
        items: any[];
    }>;
}
