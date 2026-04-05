import { Request, Response, NextFunction } from 'express';
import { fromNodeHeaders } from 'better-auth/node';
import { auth } from '../lib/auth';
import { verifyAccessToken } from '../utils/jwt';
import { prisma } from '../config/database';

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  // Legacy JWT bearer token support
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    try {
      const payload = verifyAccessToken(authHeader.slice(7));
      req.userId = BigInt(payload.userId);
      return next();
    } catch {}
  }

  // Better Auth session (cookie-based)
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });
    if (session?.user) {
      req.userId = BigInt(session.user.id);
      return next();
    }
  } catch {}

  res.status(401).json({ success: false, error: 'Unauthorized' });
};

export const optionalAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    try {
      const payload = verifyAccessToken(authHeader.slice(7));
      req.userId = BigInt(payload.userId);
    } catch {}
  }

  if (!req.userId) {
    try {
      const session = await auth.api.getSession({
        headers: fromNodeHeaders(req.headers),
      });
      if (session?.user) {
        req.userId = BigInt(session.user.id);
      }
    } catch {}
  }

  next();
};

export const requireAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  if (!req.userId) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return;
  }

  const admin = await prisma.admin.findUnique({
    where: { userId: req.userId },
  });

  if (!admin) {
    res.status(403).json({ success: false, error: 'Forbidden' });
    return;
  }

  next();
};
