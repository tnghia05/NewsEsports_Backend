import { ForbiddenException } from '@nestjs/common';
import type { PostDocument } from '../models/post.model';
import type { JwtUser } from '../types/auth';

export function assertCanReadPost(
  viewer: JwtUser | undefined,
  post: PostDocument,
) {
  if (post.status === 'published') return;
  if (!viewer) throw new ForbiddenException('Forbidden');
  if (viewer.role === 'admin') return;
  if (post.authorId === viewer.id) return;
  throw new ForbiddenException('Forbidden');
}
