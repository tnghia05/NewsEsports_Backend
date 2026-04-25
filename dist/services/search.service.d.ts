import type { Model } from 'mongoose';
import { type PostDocument } from '../models/post.model';
import { type UserDocument } from '../models/user.model';
import type { SearchPostsDto } from '../dto/search/search-posts.dto';
import type { SearchUsersDto } from '../dto/search/search-users.dto';
import type { JwtUser } from '../types/auth';
import type { CreateSearchEventDto } from '../dto/search/create-search-event.dto';
import { type SearchEventDocument } from '../models/search-event.model';
import { type HotKeywordDocument, type HotKeywordWindow } from '../models/hot-keyword.model';
export declare class SearchService {
    private readonly postModel;
    private readonly userModel;
    private readonly searchEventModel;
    private readonly hotKeywordModel;
    constructor(postModel: Model<PostDocument>, userModel: Model<UserDocument>, searchEventModel: Model<SearchEventDocument>, hotKeywordModel: Model<HotKeywordDocument>);
    searchPosts(query: SearchPostsDto): Promise<{
        items: any[];
        page: number;
        limit: number;
    }>;
    searchUsers(query: SearchUsersDto): Promise<{
        items: {
            id: string;
            displayName: any;
            avatarUrl: any;
        }[];
        page: number;
        limit: number;
    }>;
    createEvent(user: JwtUser | undefined, dto: CreateSearchEventDto): Promise<{
        ok: boolean;
    }>;
    getHotKeywords(opts: {
        window: HotKeywordWindow;
        limit: number;
    }): Promise<{
        window: HotKeywordWindow;
        items: {
            keyword: any;
            score: any;
        }[];
    }>;
    suggest(opts: {
        q: string;
        limit: number;
    }): Promise<{
        items: any[];
    }>;
}
