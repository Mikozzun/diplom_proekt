import { Request, Response, NextFunction } from 'express';
import * as reportService from '../services/report.service';
import { sendCreated, sendPaginated } from '../utils/response';

export const createReport = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const report = await reportService.createReport(
      req.userId!,
      req.body.reportType,
      req.body.description,
    );
    sendCreated(res, report);
  } catch (err) {
    next(err);
  }
};

export const getReports = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { page, limit } = req.query as { page?: string; limit?: string };
    const result = await reportService.getReports(page, limit);
    sendPaginated(res, result.reports, result.meta);
  } catch (err) {
    next(err);
  }
};
