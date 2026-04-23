export declare const ROLES_KEY = "roles";
export type Role = 'user' | 'admin';
export declare const Roles: (...roles: Role[]) => import("@nestjs/common").CustomDecorator<string>;
