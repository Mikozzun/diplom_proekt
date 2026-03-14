import { PrismaService } from '../../prisma/prisma.service.js';
export declare class BookmarksService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    toggle(postId: string, userId: string): Promise<{
        bookmarked: boolean;
    }>;
    remove(postId: string, userId: string): Promise<{
        message: string;
    }>;
    findByUser(userId: string, options?: {
        cursor?: string;
        limit?: number;
    }): Promise<{
        data: {
            id: any;
            createdAt: any;
            post: {
                id: any;
                userId: any;
                content: any;
                imageUrl: any;
                videoUrl: any;
                createdAt: any;
                author: {
                    id: any;
                    username: any;
                    profileImage: any;
                } | null;
                commentCount: any;
                likeCount: any;
            } | null;
        }[];
        hasMore: boolean;
        nextCursor: string | null;
    }>;
    private serialize;
}
