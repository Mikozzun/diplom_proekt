import { Request, Response, NextFunction } from 'express';
import * as pollService from '../services/poll.service';
import { sendSuccess, sendCreated, sendError } from '../utils/response';

export const createPoll = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const poll = await pollService.createPoll(
      BigInt(req.params.postId as string),
      req.body.question,
      req.body.options,
    );
    sendCreated(res, poll);
  } catch (err) {
    next(err);
  }
};

export const respondToPoll = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const response = await pollService.respondToPoll(
      BigInt(req.params.pollId as string),
      req.userId!,
      req.body.selectedOption,
    );
    sendSuccess(res, response);
  } catch (err: any) {
    if (err.message === 'Poll not found' || err.message === 'Invalid option') {
      sendError(res, err.message, 400);
    } else {
      next(err);
    }
  }
};

export const getPollResults = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const results = await pollService.getPollResults(
      BigInt(req.params.pollId as string),
    );
    sendSuccess(res, results);
  } catch (err: any) {
    if (err.message === 'Poll not found') {
      sendError(res, err.message, 404);
    } else {
      next(err);
    }
  }
};
