import { type ExecutionContext } from '@nestjs/common';
declare const OptionalJwtAuthGuard_base: import("@nestjs/passport").Type<import("@nestjs/passport").IAuthGuard>;
export declare class OptionalJwtAuthGuard extends OptionalJwtAuthGuard_base {
    canActivate(context: ExecutionContext): Promise<boolean>;
    handleRequest<TUser = unknown>(err: unknown, user: TUser, info: unknown, context: ExecutionContext, status?: unknown): TUser;
}
export {};
