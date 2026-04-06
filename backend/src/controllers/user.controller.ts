import { Request, Response, NextFunction } from 'express';
import * as userService from '../services/user.service';
import * as sessionService from '../services/session.service';
import {
  sendSuccess,
  sendError,
  sendNoContent,
  sendPaginated,
} from '../utils/response';

export const searchUsers = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const q = (req.query.q as string) || '';
    if (q.length < 1) {
      sendSuccess(res, []);
      return;
    }
    const { page, limit } = req.query as { page?: string; limit?: string };
    const result = await userService.searchUsers(q, page, limit);
    sendPaginated(res, result.users, result.meta);
  } catch (err) {
    next(err);
  }
};

export const getMe = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const user = await userService.getUserById(req.userId!);
    if (!user) {
      sendError(res, 'User not found', 404);
      return;
    }
    sendSuccess(res, user);
  } catch (err) {
    next(err);
  }
};

export const updateMe = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const user = await userService.updateUser(req.userId!, req.body);
    sendSuccess(res, user);
  } catch (err) {
    next(err);
  }
};

export const getUserProfile = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const user = await userService.getUserProfile(
      BigInt(req.params.id as string),
    );
    if (!user) {
      sendError(res, 'User not found', 404);
      return;
    }
    sendSuccess(res, user);
  } catch (err) {
    next(err);
  }
};

export const getSettings = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const settings = await userService.getUserSettings(req.userId!);
    sendSuccess(res, settings);
  } catch (err) {
    next(err);
  }
};

export const updateSettings = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const settings = await userService.updateUserSettings(
      req.userId!,
      req.body,
    );
    sendSuccess(res, settings);
  } catch (err) {
    next(err);
  }
};

export const getMySessions = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const sessions = await sessionService.getUserSessions(req.userId!);
    sendSuccess(res, sessions);
  } catch (err) {
    next(err);
  }
};

export const revokeSession = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    await sessionService.revokeSession(
      BigInt(req.params.sessionId as string),
      req.userId!,
    );
    sendNoContent(res);
  } catch (err) {
    next(err);
  }
};

export const deleteAccount = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    await userService.deleteUser(req.userId!);
    res.clearCookie('refreshToken');
    sendNoContent(res);
  } catch (err) {
    next(err);
  }
};
