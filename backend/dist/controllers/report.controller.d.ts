import { Request, Response, NextFunction } from 'express';
export declare const createReport: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const getReports: (req: Request, res: Response, next: NextFunction) => Promise<void>;
