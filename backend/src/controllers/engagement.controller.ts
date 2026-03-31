import { Request, Response, NextFunction } from 'express';
import * as engagementService from '../services/engagement.service';
import { sendSuccess, sendPaginated } from '../utils/response';

export const toggleLike = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const result = await engagementService.toggleLike(
      BigInt(req.params.postId as string),
      req.userId!,
    );
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
};

export const toggleBookmark = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const result = await engagementService.toggleBookmark(
      BigInt(req.params.postId as string),
      req.userId!,
    );
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
};

export const getBookmarks = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const bookmarks = await engagementService.getUserBookmarks(req.userId!);
    sendSuccess(res, bookmarks);
  } catch (err) {
    next(err);
  }
};

export const addReaction = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const reaction = await engagementService.addReaction(
      BigInt(req.params.postId as string),
      req.userId!,
      req.body.reactionType,
    );
    sendSuccess(res, reaction);
  } catch (err) {
    next(err);
  }
};

export const removeReaction = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    await engagementService.removeReaction(
      BigInt(req.params.postId as string),
      req.userId!,
      req.body.reactionType,
    );
    sendSuccess(res, { removed: true });
  } catch (err) {
    next(err);
  }
};

export const getPostReactions = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const reactions = await engagementService.getPostReactions(
      BigInt(req.params.postId as string),
    );
    sendSuccess(res, reactions);
  } catch (err) {
    next(err);
  }
};
