import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateReactionDto } from './dto/index.js';
export declare class ReactionsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    toggle(postId: string, userId: string, dto: CreateReactionDto): Promise<{
        reacted: boolean;
        reactionType: string;
    }>;
    remove(postId: string, userId: string, reactionType: string): Promise<{
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
