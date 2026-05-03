import { Request, Response, NextFunction } from 'express';
export declare const uploadFile: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const getMyFiles: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const deleteFile: (req: Request, res: Response, next: NextFunction) => Promise<void>;
