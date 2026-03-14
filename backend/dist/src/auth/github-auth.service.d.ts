import { PrismaService } from '../../prisma/prisma.service.js';
export declare class GithubAuthService {
    private readonly prisma;
    private readonly logger;
    private readonly clientId;
    private readonly clientSecret;
    private readonly callbackUrl;
    constructor(prisma: PrismaService);
    getAuthorizationUrl(): string;
    handleCallback(code: string): Promise<{
        userId: string;
        email: string | null;
        username: string;
    }>;
}
