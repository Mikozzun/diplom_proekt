import { Request, Response, NextFunction } from 'express';
import * as moderationService from '../services/moderation.service';
import { sendSuccess, sendPaginated, sendError } from '../utils/response';

export const getQueue = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { status, page, limit } = req.query as {
      status?: string;
      page?: string;
      limit?: string;
    };
    const result = await moderationService.getModerationQueue(
      status,
      page,
      limit,
    );
    sendPaginated(res, result.items, result.meta);
  } catch (err) {
    next(err);
  }
};

export const resolveItem = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const result = await moderationService.resolveModeration(
      BigInt(req.params.id as string),
      req.body.action,
    );
    sendSuccess(res, result);
  } catch (err: any) {
    if (err.message === 'Item not found') {
      sendError(res, err.message, 404);
    } else {
      next(err);
    }
  }
};
