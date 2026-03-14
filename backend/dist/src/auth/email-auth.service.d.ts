import { PrismaService } from '../../prisma/prisma.service.js';
export declare class EmailAuthService {
    private readonly prisma;
    private readonly SALT_ROUNDS;
    private readonly logger;
    constructor(prisma: PrismaService);
    register(email: string, password: string, username: string): Promise<{
        userId: string;
        email: string | null;
        username: string;
    }>;
    login(email: string, password: string): Promise<{
        userId: string;
        email: string;
        username: string;
    }>;
    private maskEmail;
}
