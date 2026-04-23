import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY, type Role } from '../decorators/roles.decorator';
import type { JwtUser } from '../types/auth';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles =
      this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? [];

    if (requiredRoles.length === 0) return true;

    const req = context.switchToHttp().getRequest<{ user?: JwtUser }>();
    const role = req.user?.role;
    if (!role) return false;

    return requiredRoles.includes(role);
  }
}
