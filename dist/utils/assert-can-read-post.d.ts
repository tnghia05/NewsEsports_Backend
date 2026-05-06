import type { PostDocument } from '../models/post.model';
import type { JwtUser } from '../types/auth';
export declare function assertCanReadPost(viewer: JwtUser | undefined, post: PostDocument): void;
