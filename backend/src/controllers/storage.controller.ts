import { Request, Response, NextFunction } from 'express';
import * as storageService from '../services/storage.service';
import {
  sendSuccess,
  sendCreated,
  sendError,
  sendNoContent,
} from '../utils/response';

export const uploadFileLocal = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.file) {
      sendError(res, 'No file uploaded', 400);
      return;
    }
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const fileUrl = `${baseUrl}/uploads/${req.file.filename}`;

    const entry = await storageService.createStorageEntry(req.userId!, {
      fileName: req.file.originalname,
      fileType: req.file.mimetype,
      fileSize: BigInt(req.file.size),
      fileUrl,
    });
    sendCreated(res, entry);
  } catch (err) {
    next(err);
  }
};

export const uploadFile = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const entry = await storageService.createStorageEntry(req.userId!, {
      fileName: req.body.fileName,
      fileType: req.body.fileType,
      fileSize: BigInt(req.body.fileSize),
      fileUrl: req.body.fileUrl,
    });
    sendCreated(res, entry);
  } catch (err) {
    next(err);
  }
};

export const getMyFiles = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const files = await storageService.getUserFiles(req.userId!);
    sendSuccess(res, files);
  } catch (err) {
    next(err);
  }
};

export const deleteFile = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    await storageService.deleteFile(
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
