import { Request, Response, NextFunction } from 'express';
import { fromNodeHeaders } from 'better-auth/node';
import { auth } from '../lib/auth';
import { verifyAccessToken } from '../utils/jwt';
import { prisma } from '../config/database';
import { sessionCache } from '../utils/session-cache';


const extractCacheKey = (req: Request): string | null => {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) return authHeader.slice(7);
  // Better Auth stores session token in a cookie
  const cookie =
    req.cookies?.['better-auth.session_token'] ??
    req.cookies?.['__Secure-better-auth.session_token'];
  return cookie ?? null;
};


const tryCache = (req: Request): boolean => {
  const key = extractCacheKey(req);
  if (!key) return false;
  const cached = sessionCache.get(key);
  if (!cached) return false;
  req.userId = cached.userId;
  req.sessionStartedAt = cached.sessionStartedAt;
  return true;
};


const cacheSession = (
  req: Request,
  userId: bigint,
  sessionStartedAt?: Date,
) => {
  const key = extractCacheKey(req);
  if (key) sessionCache.set(key, userId, sessionStartedAt);
  req.userId = userId;
  req.sessionStartedAt = sessionStartedAt;
};

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  // Fast path: in-memory cache hit
  if (tryCache(req)) return next();

  // Legacy JWT bearer token support
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    try {
      const payload = verifyAccessToken(authHeader.slice(7));
      cacheSession(req, BigInt(payload.userId));
      return next();
    } catch {}
  }

  // Better Auth session (cookie-based)
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });
    if (session?.user) {
      const started = session.session?.createdAt
        ? new Date(session.session.createdAt)
        : undefined;
      cacheSession(req, BigInt(session.user.id), started);
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
  // Fast path: in-memory cache hit
  if (tryCache(req)) return next();

  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    try {
      const payload = verifyAccessToken(authHeader.slice(7));
      cacheSession(req, BigInt(payload.userId));
    } catch {}
  }

  if (!req.userId) {
    try {
      const session = await auth.api.getSession({
        headers: fromNodeHeaders(req.headers),
      });
      if (session?.user) {
        const started = session.session?.createdAt
          ? new Date(session.session.createdAt)
          : undefined;
        cacheSession(req, BigInt(session.user.id), started);
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
