import { PrismaService } from '../../prisma/prisma.service.js';
export interface TelegramAuthData {
    id: number;
    first_name?: string;
    last_name?: string;
    username?: string;
    photo_url?: string;
    auth_date: number;
    hash: string;
}
export declare class TelegramAuthService {
    private readonly prisma;
    private readonly logger;
    private readonly botToken;
    private readonly botUsername;
    private readonly codeTtlMs;
    private readonly botBaseUrl;
    constructor(prisma: PrismaService);
    createLoginCode(): Promise<{
        code: string;
        expiresInSeconds: number;
        botStartUrl: string;
        instruction: string;
    }>;
    authenticateWithCode(code: string): Promise<{
        userId: string;
        email: string | null;
        username: string;
    }>;
    verifyAuth(data: TelegramAuthData): boolean;
    authenticate(data: TelegramAuthData): Promise<{
        userId: string;
        email: string | null;
        username: string;
    }>;
    private upsertTelegramUser;
    private registerCodeInBot;
    private consumeCodeFromBot;
    private callBotApi;
}
