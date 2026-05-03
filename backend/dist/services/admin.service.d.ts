export declare const getAdminDashboard: () => Promise<{
    totalUsers: number;
    totalPosts: number;
    totalComments: number;
    pendingModeration: number;
}>;
export declare const getAllUsers: (page?: string, limit?: string) => Promise<{
    users: {
        id: bigint;
        username: string;
        phoneNumber: string;
        profileImage: string | null;
        createdAt: Date;
        admin: {
            id: bigint;
            createdAt: Date;
            userId: bigint | null;
        } | null;
        userRoles: ({
            role: {
                name: string;
                id: bigint;
            } | null;
        } & {
            id: bigint;
            userId: bigint | null;
            roleId: bigint | null;
        })[];
    }[];
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}>;
export declare const assignRole: (userId: bigint, roleName: string) => Promise<{
    id: bigint;
    userId: bigint | null;
    roleId: bigint | null;
}>;
export declare const removeRole: (userId: bigint, roleName: string) => Promise<import(".prisma/client").Prisma.BatchPayload | undefined>;
export declare const promoteToAdmin: (userId: bigint) => Promise<{
    id: bigint;
    createdAt: Date;
    userId: bigint | null;
}>;
export declare const demoteAdmin: (userId: bigint) => Promise<import(".prisma/client").Prisma.BatchPayload>;
export declare const banUser: (userId: bigint) => Promise<void>;
