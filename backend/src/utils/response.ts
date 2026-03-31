import { Response } from 'express';

const serialize = (data: any): any =>
  JSON.parse(
    JSON.stringify(data, (_, v) => (typeof v === 'bigint' ? v.toString() : v)),
  );

export const sendSuccess = (res: Response, data: any, status = 200) => {
  res.status(status).json({ success: true, data: serialize(data) });
};

export const sendPaginated = (
  res: Response,
  data: any,
  meta: { page: number; limit: number; total: number; totalPages: number },
) => {
  res.status(200).json({ success: true, data: serialize(data), meta });
};

export const sendError = (res: Response, message: string, status = 400) => {
  res.status(status).json({ success: false, error: message });
};

export const sendCreated = (res: Response, data: any) => {
  sendSuccess(res, data, 201);
};

export const sendNoContent = (res: Response) => {
  res.status(204).send();
};
