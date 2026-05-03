import { Request, Response, NextFunction } from 'express';
export declare const getDashboard: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const getAllUsers: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const assignRole: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const removeRole: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const promoteToAdmin: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const banUser: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const getMetrics: (req: Request, res: Response, next: NextFunction) => Promise<void>;
