import { Request, Response, NextFunction } from 'express';
export declare const getMe: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const updateMe: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const getUserProfile: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const getSettings: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const updateSettings: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const getMySessions: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const revokeSession: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const deleteAccount: (req: Request, res: Response, next: NextFunction) => Promise<void>;
