import type { Request, Response } from 'express';
import { GithubAuthService } from './github-auth.service.js';
import { TelegramAuthService } from './telegram-auth.service.js';
import { SessionService } from './session.service.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { TelegramAuthDto, TelegramCodeVerifyDto } from './dto/index.js';
export declare class AuthController {
    private readonly githubAuth;
    private readonly telegramAuth;
    private readonly sessionService;
    private readonly prisma;
    constructor(githubAuth: GithubAuthService, telegramAuth: TelegramAuthService, sessionService: SessionService, prisma: PrismaService);
    githubRedirect(res: Response): void;
    githubCallback(code: string, req: Request, res: Response): Promise<void>;
    telegramRequestCode(): Promise<{
        code: string;
        expiresInSeconds: number;
        botStartUrl: string;
        instruction: string;
    }>;
    telegramVerifyCode(dto: TelegramCodeVerifyDto, req: Request): Promise<{
        userId: string;
        email: string | null;
        username: string;
        message: string;
    }>;
    telegramLogin(dto: TelegramAuthDto, req: Request): Promise<{
        userId: string;
        email: string | null;
        username: string;
        message: string;
    }>;
    telegramCallback(idRaw: string, authDateRaw: string, hash: string, firstName: string | undefined, lastName: string | undefined, username: string | undefined, photoUrl: string | undefined, returnToRaw: string | undefined, req: Request, res: Response): Promise<void>;
    me(req: Request): Promise<{
        userId: string;
        email: string | undefined;
        sessionId: string;
        userAgent: string | undefined;
        ip: string | undefined;
        createdAt: number | undefined;
        authStatus: {
            github: boolean;
            telegram: boolean;
        };
    }>;
    listSessions(req: Request): Promise<{
        sessions: {
            sessionId: string;
            userAgent?: string;
            ip?: string;
            createdAt?: number;
        }[];
        currentSessionId: string;
    }>;
    destroySession(sessionId: string, req: Request): Promise<{
        message: string;
    }>;
    logout(req: Request): Promise<{
        message: string;
    }>;
    logoutAll(req: Request): Promise<{
        message: string;
    }>;
    private getSafeReturnPath;
}
