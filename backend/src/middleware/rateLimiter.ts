import rateLimit from 'express-rate-limit';
import type { Request } from 'express';

const isTest = process.env.NODE_ENV === 'test';

const skipPaths = ['/admin', '/api/auth', '/auth', '/health'];

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests' },
  skip: (req: Request) =>
    isTest || skipPaths.some((p) => req.path.startsWith(p)),
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many auth attempts' },
  skip: () => isTest,
});
