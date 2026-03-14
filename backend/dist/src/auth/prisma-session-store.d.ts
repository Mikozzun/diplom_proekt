import { Store, type SessionData } from 'express-session';
import { PrismaClient } from '@prisma/client';
export declare class PrismaSessionStore extends Store {
    private readonly ttlMs;
    private readonly prisma;
    private cleanupTimer;
    constructor(prisma: PrismaClient, ttlMs?: number);
    get: (sid: string, callback: (err: any, session?: SessionData | null) => void) => void;
    set: (sid: string, session: SessionData, callback?: (err?: any) => void) => void;
    destroy: (sid: string, callback?: (err?: any) => void) => void;
    touch: (sid: string, session: SessionData, callback?: (err?: any) => void) => void;
    private cleanup;
    close(): void;
}
