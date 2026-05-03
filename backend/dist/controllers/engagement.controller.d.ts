import { Request, Response, NextFunction } from 'express';
export declare const toggleLike: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const toggleBookmark: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const getBookmarks: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const addReaction: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const removeReaction: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const getPostReactions: (req: Request, res: Response, next: NextFunction) => Promise<void>;
