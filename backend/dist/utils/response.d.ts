import { Response } from 'express';
export declare const sendSuccess: (res: Response, data: any, status?: number) => void;
export declare const sendPaginated: (res: Response, data: any, meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}) => void;
export declare const sendError: (res: Response, message: string, status?: number) => void;
export declare const sendCreated: (res: Response, data: any) => void;
export declare const sendNoContent: (res: Response) => void;
