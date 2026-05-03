import { Request, Response, NextFunction } from 'express';
export declare const createPoll: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const respondToPoll: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const getPollResults: (req: Request, res: Response, next: NextFunction) => Promise<void>;
