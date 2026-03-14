import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateCommentDto, UpdateCommentDto } from './dto/index.js';
export declare class CommentsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(postId: string, userId: string, dto: CreateCommentDto): Promise<{
        id: any;
        postId: any;
        userId: any;
        content: any;
        createdAt: any;
        updatedAt: any;
        author: {
            id: any;
            username: any;
            profileImage: any;
        } | null;
    }>;
    findByPost(postId: string, options?: {
        cursor?: string;
        limit?: number;
    }): Promise<{
        data: {
            id: any;
            postId: any;
            userId: any;
            content: any;
            createdAt: any;
            updatedAt: any;
            author: {
                id: any;
                username: any;
                profileImage: any;
            } | null;
        }[];
        hasMore: boolean;
        nextCursor: string | null;
    }>;
    update(commentId: string, userId: string, dto: UpdateCommentDto): Promise<{
        id: any;
        postId: any;
        userId: any;
        content: any;
        createdAt: any;
        updatedAt: any;
        author: {
            id: any;
            username: any;
            profileImage: any;
        } | null;
    }>;
    remove(commentId: string, userId: string): Promise<{
        message: string;
    }>;
    private serialize;
}
