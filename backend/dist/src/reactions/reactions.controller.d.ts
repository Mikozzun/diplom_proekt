import type { Request } from 'express';
import { ReactionsService } from './reactions.service.js';
import { CreateReactionDto } from './dto/index.js';
export declare class ReactionsController {
    private readonly reactionsService;
    constructor(reactionsService: ReactionsService);
    toggle(postId: string, req: Request, dto: CreateReactionDto): Promise<{
        reacted: boolean;
        reactionType: string;
    }>;
    remove(postId: string, req: Request, type: string): Promise<{
        message: string;
    }>;
    findByPost(postId: string): Promise<{
        postId: string;
        reactions: {
            reactionType: string;
            count: number;
        }[];
    }>;
}
