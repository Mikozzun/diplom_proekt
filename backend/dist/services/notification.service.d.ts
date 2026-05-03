export declare const getUserNotifications: (userId: bigint, page?: string, limit?: string) => Promise<{
    notifications: {
        message: string;
        id: bigint;
        createdAt: Date;
        userId: bigint | null;
        type: string;
        readAt: Date | null;
    }[];
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}>;
export declare const markAsRead: (id: bigint, userId: bigint) => Promise<import(".prisma/client").Prisma.BatchPayload>;
export declare const markAllAsRead: (userId: bigint) => Promise<import(".prisma/client").Prisma.BatchPayload>;
export declare const getUnreadCount: (userId: bigint) => Promise<number>;
export declare const createNotification: (userId: bigint, type: string, message: string) => Promise<{
    message: string;
    id: bigint;
    createdAt: Date;
    userId: bigint | null;
    type: string;
    readAt: Date | null;
}>;
