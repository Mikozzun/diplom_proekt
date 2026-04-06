import { Request, Response, NextFunction } from 'express';

declare global {
  namespace Express {
    interface Request {
      userId?: bigint;
      sessionStartedAt?: Date;
    }
  }
}

export interface PaginationQuery {
  page?: string;
  limit?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export type AsyncHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
) => Promise<void>;
