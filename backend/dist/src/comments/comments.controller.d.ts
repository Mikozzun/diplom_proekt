import type { Request } from 'express';
import { CommentsService } from './comments.service.js';
import { CreateCommentDto, UpdateCommentDto } from './dto/index.js';
export declare class CommentsController {
    private readonly commentsService;
    constructor(commentsService: CommentsService);
    create(postId: string, req: Request, dto: CreateCommentDto): Promise<{
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
    findByPost(postId: string, cursor?: string, limit?: string): Promise<{
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
    update(id: string, req: Request, dto: UpdateCommentDto): Promise<{
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
    remove(id: string, req: Request): Promise<{
        message: string;
    }>;
}
