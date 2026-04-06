import { Request, Response, NextFunction } from 'express';
import * as followService from '../services/follow.service';
import { sendSuccess, sendError, sendPaginated } from '../utils/response';

export const toggleFollow = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const result = await followService.toggleFollow(
      req.userId!,
      BigInt(req.params.id as string),
    );
    sendSuccess(res, result);
  } catch (err: any) {
    if (err.message === 'Cannot follow yourself') {
      sendError(res, err.message, 400);
    } else {
      next(err);
    }
  }
};

export const getFollowers = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { page, limit } = req.query as { page?: string; limit?: string };
    const result = await followService.getFollowers(
      BigInt(req.params.id as string),
      page,
      limit,
    );
    sendPaginated(res, result.followers, result.meta);
  } catch (err) {
    next(err);
  }
};

export const getFollowing = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { page, limit } = req.query as { page?: string; limit?: string };
    const result = await followService.getFollowing(
      BigInt(req.params.id as string),
      page,
      limit,
    );
    sendPaginated(res, result.following, result.meta);
  } catch (err) {
    next(err);
  }
};

export const checkFollowing = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const isFollowing = await followService.isFollowing(
      req.userId!,
      BigInt(req.params.id as string),
    );
    sendSuccess(res, { isFollowing });
  } catch (err) {
    next(err);
  }
};
