import type { Request } from 'express';
import { BookmarksService } from './bookmarks.service.js';
export declare class BookmarksController {
    private readonly bookmarksService;
    constructor(bookmarksService: BookmarksService);
    toggle(postId: string, req: Request): Promise<{
        bookmarked: boolean;
    }>;
    remove(postId: string, req: Request): Promise<{
        message: string;
    }>;
    findMyBookmarks(req: Request, cursor?: string, limit?: string): Promise<{
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
}
