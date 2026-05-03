import { Request, Response, NextFunction } from 'express';
export declare const startRegistration: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const finishRegistration: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const startAuthentication: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const finishAuthentication: (req: Request, res: Response, next: NextFunction) => Promise<void>;
