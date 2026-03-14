import type { Request } from 'express';
import { LikesService } from './likes.service.js';
export declare class LikesController {
    private readonly likesService;
    constructor(likesService: LikesService);
    toggle(postId: string, req: Request): Promise<{
        liked: boolean;
    }>;
    unlike(postId: string, req: Request): Promise<{
        message: string;
    }>;
    findByPost(postId: string, cursor?: string, limit?: string): Promise<{
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
}
