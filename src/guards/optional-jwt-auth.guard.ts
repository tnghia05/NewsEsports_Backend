import { Injectable, type ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  // Allow requests without Authorization header (no token) to pass through.
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<{ headers?: Record<string, unknown> }>();
    const auth = req.headers?.['authorization'];
    if (!auth) return true;
    return (await super.canActivate(context)) as boolean;
  }

  handleRequest<TUser = unknown>(
    err: unknown,
    user: TUser,
    info: unknown,
    context: ExecutionContext,
    status?: unknown,
  ): TUser {
    const req = context.switchToHttp().getRequest<{ headers?: Record<string, unknown> }>();
    const auth = req.headers?.['authorization'];
    if (!auth) return undefined as TUser;
    return super.handleRequest(err, user, info, context, status) as TUser;
  }
}
