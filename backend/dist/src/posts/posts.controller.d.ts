import type { Request } from 'express';
import { PostsService } from './posts.service.js';
import { CreatePostDto, UpdatePostDto } from './dto/index.js';
export declare class PostsController {
    private readonly postsService;
    constructor(postsService: PostsService);
    create(req: Request, dto: CreatePostDto): Promise<{
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
    findAll(cursor?: string, limit?: string): Promise<{
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
    findByUser(userId: string, cursor?: string, limit?: string): Promise<{
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
    findOne(id: string): Promise<{
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
    update(id: string, req: Request, dto: UpdatePostDto): Promise<{
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
    remove(id: string, req: Request): Promise<{
        message: string;
    }>;
}
