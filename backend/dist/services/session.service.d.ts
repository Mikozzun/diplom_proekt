export declare const createSession: (userId: bigint, refreshToken: string, deviceInfo?: string, ipAddress?: string) => Promise<{
    session: {
        id: bigint;
        createdAt: Date;
        userId: bigint;
        refreshToken: string;
        deviceInfo: string | null;
        ipAddress: string | null;
        expiresAt: Date;
        lastActive: Date;
    };
}>;
export declare const validateRefreshToken: (userId: bigint, refreshToken: string) => Promise<{
    id: bigint;
    createdAt: Date;
    userId: bigint;
    refreshToken: string;
    deviceInfo: string | null;
    ipAddress: string | null;
    expiresAt: Date;
    lastActive: Date;
} | null>;
export declare const rotateRefreshToken: (sessionId: bigint, newRefreshToken: string) => Promise<{
    id: bigint;
    createdAt: Date;
    userId: bigint;
    refreshToken: string;
    deviceInfo: string | null;
    ipAddress: string | null;
    expiresAt: Date;
    lastActive: Date;
}>;
export declare const getUserSessions: (userId: bigint) => Promise<{
    id: bigint;
    createdAt: Date;
    deviceInfo: string | null;
    ipAddress: string | null;
    lastActive: Date;
}[]>;
export declare const revokeSession: (sessionId: bigint, userId: bigint) => Promise<import(".prisma/client").Prisma.BatchPayload>;
export declare const revokeAllSessions: (userId: bigint) => Promise<import(".prisma/client").Prisma.BatchPayload>;
export declare const cleanExpiredSessions: () => Promise<import(".prisma/client").Prisma.BatchPayload>;
