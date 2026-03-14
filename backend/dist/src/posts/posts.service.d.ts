import { PrismaService } from '../../prisma/prisma.service.js';
import { CreatePostDto, UpdatePostDto } from './dto/index.js';
export declare class PostsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(userId: string, dto: CreatePostDto): Promise<{
        id: any;
        userId: any;
        content: any;
        imageUrl: any;
        videoUrl: any;
        createdAt: any;
        updatedAt: any;
        author: {
            id: any;
            username: any;
            profileImage: any;
        } | null;
        commentCount: any;
        likeCount: any;
    }>;
    findAll(options?: {
        cursor?: string;
        limit?: number;
    }): Promise<{
        data: {
            id: any;
            userId: any;
            content: any;
            imageUrl: any;
            videoUrl: any;
            createdAt: any;
            updatedAt: any;
            author: {
                id: any;
                username: any;
                profileImage: any;
            } | null;
            commentCount: any;
            likeCount: any;
        }[];
        hasMore: boolean;
        nextCursor: string | null;
    }>;
    findByUser(targetUserId: string, options?: {
        cursor?: string;
        limit?: number;
    }): Promise<{
        data: {
            id: any;
            userId: any;
            content: any;
            imageUrl: any;
            videoUrl: any;
            createdAt: any;
            updatedAt: any;
            author: {
                id: any;
                username: any;
                profileImage: any;
            } | null;
            commentCount: any;
            likeCount: any;
        }[];
        hasMore: boolean;
        nextCursor: string | null;
    }>;
    findOne(postId: string): Promise<{
        id: any;
        userId: any;
        content: any;
        imageUrl: any;
        videoUrl: any;
        createdAt: any;
        updatedAt: any;
        author: {
            id: any;
            username: any;
            profileImage: any;
        } | null;
        commentCount: any;
        likeCount: any;
    }>;
    update(postId: string, userId: string, dto: UpdatePostDto): Promise<{
        id: any;
        userId: any;
        content: any;
        imageUrl: any;
        videoUrl: any;
        createdAt: any;
        updatedAt: any;
        author: {
            id: any;
            username: any;
            profileImage: any;
        } | null;
        commentCount: any;
        likeCount: any;
    }>;
    remove(postId: string, userId: string): Promise<{
        message: string;
    }>;
    private serialize;
}
