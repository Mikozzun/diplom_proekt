import { PrismaService } from '../../prisma/prisma.service.js';
export declare class LikesService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    toggle(postId: string, userId: string): Promise<{
        liked: boolean;
    }>;
    unlike(postId: string, userId: string): Promise<{
        message: string;
    }>;
    findByPost(postId: string, options?: {
        cursor?: string;
        limit?: number;
    }): Promise<{
        data: {
            id: any;
            userId: any;
            postId: any;
            createdAt: any;
            user: {
                id: any;
                username: any;
                profileImage: any;
            } | null;
        }[];
        hasMore: boolean;
        nextCursor: string | null;
    }>;
    private serialize;
}
