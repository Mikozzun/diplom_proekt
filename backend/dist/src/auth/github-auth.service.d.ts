import { PrismaService } from '../../prisma/prisma.service.js';
interface GitHubAuthorizationOptions {
    state?: string;
}
export declare class GithubAuthService {
    private readonly prisma;
    private readonly logger;
    private readonly clientId;
    private readonly clientSecret;
    private readonly callbackUrl;
    constructor(prisma: PrismaService);
    getAuthorizationUrl(options?: GitHubAuthorizationOptions): string;
    handleCallback(code: string): Promise<{
        userId: string;
        email: string | null;
        username: string;
    }>;
}
export {};
