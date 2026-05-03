import { Request, Response, NextFunction } from 'express';
export declare const getQueue: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const resolveItem: (req: Request, res: Response, next: NextFunction) => Promise<void>;
