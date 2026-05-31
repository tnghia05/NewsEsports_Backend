export type JwtUser = {
    id: string;
    email: string;
    displayName: string;
    role: 'user' | 'admin';
    avatarUrl?: string;
    points?: number;
};
export type JwtPayload = {
    sub: string;
    role: 'user' | 'admin';
};
