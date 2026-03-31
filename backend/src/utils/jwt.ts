import jwt from 'jsonwebtoken';
import { env } from '../config/env';

interface TokenPayload {
  userId: string;
  type: 'access' | 'refresh';
}

export const generateAccessToken = (userId: string): string => {
  return jwt.sign({ userId, type: 'access' } as TokenPayload, env.jwtSecret, {
    expiresIn: '15m',
  });
};

export const generateRefreshToken = (userId: string): string => {
  return jwt.sign(
    { userId, type: 'refresh' } as TokenPayload,
    env.jwtRefreshSecret,
    { expiresIn: '30d' },
  );
};

export const verifyAccessToken = (token: string): TokenPayload => {
  return jwt.verify(token, env.jwtSecret) as TokenPayload;
};

export const verifyRefreshToken = (token: string): TokenPayload => {
  return jwt.verify(token, env.jwtRefreshSecret) as TokenPayload;
};

export const generateTokenPair = (userId: string) => ({
  accessToken: generateAccessToken(userId),
  refreshToken: generateRefreshToken(userId),
});
