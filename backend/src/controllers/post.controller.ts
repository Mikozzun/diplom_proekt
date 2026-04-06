import { Request, Response, NextFunction } from 'express';
import * as postService from '../services/post.service';
import * as feedService from '../services/feed.service';
import {
  sendSuccess,
  sendCreated,
  sendError,
  sendNoContent,
  sendPaginated,
} from '../utils/response';

export const createPost = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const post = await postService.createPost(req.userId!, req.body);
    // Propagate to all users' randomized feeds
    await feedService.onPostCreated(post.id);
    sendCreated(res, post);
  } catch (err) {
    next(err);
  }
};

export const getPosts = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { page, limit } = req.query as { page?: string; limit?: string };
    const result = await postService.getPosts(page, limit);
    sendPaginated(res, result.posts, result.meta);
  } catch (err) {
    next(err);
  }
};

export const getPostById = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const post = await postService.getPostById(BigInt(req.params.id as string));
    if (!post) {
      sendError(res, 'Post not found', 404);
      return;
    }
    sendSuccess(res, post);
  } catch (err) {
    next(err);
  }
};

export const updatePost = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const post = await postService.updatePost(
      BigInt(req.params.id as string),
      req.userId!,
      req.body,
    );
    sendSuccess(res, post);
  } catch (err: any) {
    if (err.message === 'Not authorized') {
      sendError(res, err.message, 403);
    } else {
      next(err);
    }
  }
};

export const deletePost = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const postId = BigInt(req.params.id as string);
    await postService.deletePost(postId, req.userId!);
    await feedService.onPostDeleted(postId);
    sendNoContent(res);
  } catch (err: any) {
    if (err.message === 'Not authorized') {
      sendError(res, err.message, 403);
    } else {
      next(err);
    }
  }
};

export const getUserPosts = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { page, limit } = req.query as { page?: string; limit?: string };
    const result = await postService.getUserPosts(
      BigInt(req.params.userId as string),
      page,
      limit,
    );
    sendPaginated(res, result.posts, result.meta);
  } catch (err) {
    next(err);
  }
};

export const getFeed = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { page, limit } = req.query as { page?: string; limit?: string };
    const result = await feedService.getRandomizedFeed(
      req.userId!,
      page,
      limit,
    );
    sendPaginated(res, result.posts, result.meta);
  } catch (err) {
    next(err);
  }
};
