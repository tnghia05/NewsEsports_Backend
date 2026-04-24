import type { Model } from 'mongoose';
import { type PostDocument } from '../models/post.model';
import { type UserDocument } from '../models/user.model';
import type { SearchPostsDto } from '../dto/search/search-posts.dto';
import type { SearchUsersDto } from '../dto/search/search-users.dto';
export declare class SearchService {
    private readonly postModel;
    private readonly userModel;
    constructor(postModel: Model<PostDocument>, userModel: Model<UserDocument>);
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
}
