import { Request, Response, NextFunction } from 'express';
export declare const createPost: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const getPosts: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const getPostById: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const updatePost: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const deletePost: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const getUserPosts: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const getFeed: (req: Request, res: Response, next: NextFunction) => Promise<void>;
