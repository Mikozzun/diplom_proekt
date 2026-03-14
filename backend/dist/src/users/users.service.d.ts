import { PrismaService } from '../../prisma/prisma.service.js';
import { UpdateProfileDto, UpdateSettingsDto } from './dto/index.js';
export declare class UsersService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getProfile(userId: string): Promise<{
        id: string;
        email: string | null;
        username: string;
        profileImage: string | null;
        createdAt: Date | null;
    }>;
    getPublicProfile(targetUserId: string): Promise<{
        id: string;
        username: string;
        profileImage: string | null;
        createdAt: Date | null;
        postCount: number;
    }>;
    updateProfile(userId: string, dto: UpdateProfileDto): Promise<{
        id: string;
        email: string | null;
        username: string;
        profileImage: string | null;
        createdAt: Date | null;
    }>;
    getSettings(userId: string): Promise<{
        id: string;
        theme: string | null;
        notificationsEnabled: boolean | null;
        createdAt: Date | null;
    }>;
    updateSettings(userId: string, dto: UpdateSettingsDto): Promise<{
        id: string;
        theme: string | null;
        notificationsEnabled: boolean | null;
        createdAt: Date | null;
    }>;
}
