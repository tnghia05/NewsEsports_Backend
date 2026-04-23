import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { JwtUser } from '../types/auth';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): JwtUser | undefined => {
    const req = ctx.switchToHttp().getRequest<{ user?: JwtUser }>();
    return req.user;
  },
);
