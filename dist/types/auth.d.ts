export type JwtUser = {
    id: string;
    email: string;
    displayName: string;
    role: 'user' | 'admin';
    avatarUrl?: string;
};
export type JwtPayload = {
    sub: string;
    role: 'user' | 'admin';
};
