import { Request, Response, NextFunction } from 'express';
export declare const getNotifications: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const markAsRead: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const markAllAsRead: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const getUnreadCount: (req: Request, res: Response, next: NextFunction) => Promise<void>;
