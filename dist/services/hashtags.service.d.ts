import type { Model } from 'mongoose';
import { type PostDocument } from '../models/post.model';
import { type CommentDocument } from '../models/comment.model';
import { type HashtagEventDocument } from '../models/hashtag-event.model';
import { type HotTopicDocument, type HotTopicWindow } from '../models/hot-topic.model';
import type { JwtUser } from '../types/auth';
import type { CreateHashtagEventDto } from '../dto/hashtags/create-hashtag-event.dto';
import type { HotTopicsDto } from '../dto/hashtags/hot-topics.dto';
export declare class HashtagsService {
    private readonly postModel;
    private readonly commentModel;
    private readonly hashtagEventModel;
    private readonly hotTopicModel;
    constructor(postModel: Model<PostDocument>, commentModel: Model<CommentDocument>, hashtagEventModel: Model<HashtagEventDocument>, hotTopicModel: Model<HotTopicDocument>);
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
    createEvent(user: JwtUser | undefined, dto: CreateHashtagEventDto): Promise<{
        ok: boolean;
    }>;
    hotTopics(query: HotTopicsDto): Promise<{
        window: HotTopicWindow;
        updatedAt: string | undefined;
        items: {
            rank: number;
            tag: any;
            hotness: any;
            components: any;
            trend: any;
        }[];
    }>;
}
