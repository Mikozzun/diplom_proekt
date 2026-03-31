import { Request, Response, NextFunction } from 'express';
import { getAuth } from '@clerk/express';
import { verifyAccessToken } from '../utils/jwt';
import { prisma } from '../config/database';

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    try {
      const payload = verifyAccessToken(authHeader.slice(7));
      req.userId = BigInt(payload.userId);
      return next();
    } catch {}
  }

  try {
    const auth = getAuth(req);
    if (auth?.userId) {
      const user = await prisma.user.findFirst({
        where: { clerkId: auth.userId },
      });
      if (user) {
        req.userId = user.id;
        return next();
      }
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
