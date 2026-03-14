import { PrismaService } from '../../prisma/prisma.service.js';
import type { Request } from 'express';
export declare class SessionService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    createSession(req: Request, userId: string, email: string): void;
    listUserSessions(userId: string): Promise<{
        sessionId: string;
        userAgent?: string;
        ip?: string;
        createdAt?: number;
    }[]>;
    destroySession(sessionId: string): Promise<boolean>;
    destroyAllUserSessions(userId: string): Promise<number>;
}
