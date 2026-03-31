import { Request, Response, NextFunction } from 'express';
import * as adminService from '../services/admin.service';
import * as metricsService from '../services/metrics.service';
import { sendSuccess, sendPaginated, sendNoContent } from '../utils/response';

export const getDashboard = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const dashboard = await adminService.getAdminDashboard();
    sendSuccess(res, dashboard);
  } catch (err) {
    next(err);
  }
};

export const getAllUsers = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { page, limit } = req.query as { page?: string; limit?: string };
    const result = await adminService.getAllUsers(page, limit);
    sendPaginated(res, result.users, result.meta);
  } catch (err) {
    next(err);
  }
};

export const assignRole = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const result = await adminService.assignRole(
      BigInt(req.params.userId as string),
      req.body.role,
    );
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
};

export const removeRole = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    await adminService.removeRole(
      BigInt(req.params.userId as string),
      req.body.role,
    );
    sendNoContent(res);
  } catch (err) {
    next(err);
  }
};

export const promoteToAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const result = await adminService.promoteToAdmin(
      BigInt(req.params.userId as string),
    );
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
};

export const banUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    await adminService.banUser(BigInt(req.params.userId as string));
    sendNoContent(res);
  } catch (err) {
    next(err);
  }
};

export const getMetrics = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { startDate, endDate } = req.query as {
      startDate?: string;
      endDate?: string;
    };
    const start = startDate
      ? new Date(startDate)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();
    const metrics = await metricsService.getDailyMetrics(start, end);
    sendSuccess(res, metrics);
  } catch (err) {
    next(err);
  }
};
