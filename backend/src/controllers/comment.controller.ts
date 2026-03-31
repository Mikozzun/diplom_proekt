import { Request, Response, NextFunction } from 'express';
import * as commentService from '../services/comment.service';
import {
  sendSuccess,
  sendCreated,
  sendError,
  sendNoContent,
  sendPaginated,
} from '../utils/response';

export const createComment = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const comment = await commentService.createComment(
      BigInt(req.params.postId as string),
      req.userId!,
      req.body.content,
    );
    sendCreated(res, comment);
  } catch (err: any) {
    if (err.message === 'Post not found') {
      sendError(res, err.message, 404);
    } else {
      next(err);
    }
  }
};

export const getPostComments = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { page, limit } = req.query as { page?: string; limit?: string };
    const result = await commentService.getPostComments(
      BigInt(req.params.postId as string),
      page,
      limit,
    );
    sendPaginated(res, result.comments, result.meta);
  } catch (err) {
    next(err);
  }
};

export const updateComment = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const comment = await commentService.updateComment(
      BigInt(req.params.id as string),
      req.userId!,
      req.body.content,
    );
    sendSuccess(res, comment);
  } catch (err: any) {
    if (err.message === 'Not authorized') {
      sendError(res, err.message, 403);
    } else {
      next(err);
    }
  }
};

export const deleteComment = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    await commentService.deleteComment(
      BigInt(req.params.id as string),
      req.userId!,
    );
    sendNoContent(res);
  } catch (err: any) {
    if (err.message === 'Not authorized') {
      sendError(res, err.message, 403);
    } else {
      next(err);
    }
  }
};
