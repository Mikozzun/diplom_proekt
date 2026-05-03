import { Request, Response, NextFunction } from 'express';
export declare const createComment: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const getPostComments: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const updateComment: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const deleteComment: (req: Request, res: Response, next: NextFunction) => Promise<void>;
