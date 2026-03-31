import { Request, Response, NextFunction } from 'express';
import * as notificationService from '../services/notification.service';
import { sendSuccess, sendPaginated, sendNoContent } from '../utils/response';

export const getNotifications = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { page, limit } = req.query as { page?: string; limit?: string };
    const result = await notificationService.getUserNotifications(
      req.userId!,
      page,
      limit,
    );
    sendPaginated(res, result.notifications, result.meta);
  } catch (err) {
    next(err);
  }
};

export const markAsRead = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    await notificationService.markAsRead(
      BigInt(req.params.id as string),
      req.userId!,
    );
    sendNoContent(res);
  } catch (err) {
    next(err);
  }
};

export const markAllAsRead = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    await notificationService.markAllAsRead(req.userId!);
    sendNoContent(res);
  } catch (err) {
    next(err);
  }
};

export const getUnreadCount = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const count = await notificationService.getUnreadCount(req.userId!);
    sendSuccess(res, { count });
  } catch (err) {
    next(err);
  }
};
