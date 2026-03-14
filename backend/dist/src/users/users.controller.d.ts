import type { Request } from 'express';
import { UsersService } from './users.service.js';
import { UpdateProfileDto, UpdateSettingsDto } from './dto/index.js';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    getProfile(req: Request): Promise<{
        id: string;
        email: string | null;
        username: string;
        profileImage: string | null;
        createdAt: Date | null;
    }>;
    updateProfile(req: Request, dto: UpdateProfileDto): Promise<{
        id: string;
        email: string | null;
        username: string;
        profileImage: string | null;
        createdAt: Date | null;
    }>;
    getSettings(req: Request): Promise<{
        id: string;
        theme: string | null;
        notificationsEnabled: boolean | null;
        createdAt: Date | null;
    }>;
    updateSettings(req: Request, dto: UpdateSettingsDto): Promise<{
        id: string;
        theme: string | null;
        notificationsEnabled: boolean | null;
        createdAt: Date | null;
    }>;
    getPublicProfile(id: string): Promise<{
        id: string;
        username: string;
        profileImage: string | null;
        createdAt: Date | null;
        postCount: number;
    }>;
}
