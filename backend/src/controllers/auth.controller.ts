import { Request, Response, NextFunction } from 'express';
import * as authService from '../services/auth.service';
import * as sessionService from '../services/session.service';
import { verifyRefreshToken, generateTokenPair } from '../utils/jwt';
import { sendSuccess, sendCreated, sendError } from '../utils/response';

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { username, phoneNumber, passkey } = req.body;
    const user = await authService.register(username, phoneNumber, passkey);
    sendCreated(res, user);
  } catch (err: any) {
    if (err.message === 'User already exists') {
      sendError(res, err.message, 409);
    } else {
      next(err);
    }
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { username, passkey } = req.body;
    const deviceInfo = req.headers['user-agent'];
    const ipAddress = req.ip;
    const result = await authService.login(
      username,
      passkey,
      deviceInfo,
      ipAddress,
    );

    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    sendSuccess(res, {
      user: result.user,
      accessToken: result.accessToken,
    });
  } catch (err: any) {
    if (err.message === 'Invalid credentials') {
      sendError(res, err.message, 401);
    } else {
      next(err);
    }
  }
};

export const refresh = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const token = req.cookies?.refreshToken || req.body.refreshToken;
    if (!token) {
      sendError(res, 'Refresh token required', 401);
      return;
    }

    const payload = verifyRefreshToken(token);
    const userId = BigInt(payload.userId);
    const session = await sessionService.validateRefreshToken(userId, token);
    if (!session) {
      sendError(res, 'Invalid refresh token', 401);
      return;
    }

    const tokens = generateTokenPair(userId.toString());
    await sessionService.rotateRefreshToken(session.id, tokens.refreshToken);

    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    sendSuccess(res, { accessToken: tokens.accessToken });
  } catch (err) {
    next(err);
  }
};

export const logout = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (req.userId) {
      await sessionService.revokeAllSessions(req.userId);
    }
    res.clearCookie('refreshToken');
    sendSuccess(res, { message: 'Logged out' });
  } catch (err) {
    next(err);
  }
};
