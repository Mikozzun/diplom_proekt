import bcrypt from 'bcryptjs';
import { prisma } from '../config/database';

export const createSession = async (
  userId: bigint,
  refreshToken: string,
  deviceInfo?: string,
  ipAddress?: string,
) => {
  const hashed = await bcrypt.hash(refreshToken, 10);
  const session = await prisma.session.create({
    data: {
      userId,
      refreshToken: hashed,
      deviceInfo,
      ipAddress,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });
  return { session };
};

export const validateRefreshToken = async (userId: bigint, refreshToken: string) => {
  // Limit to 10 most recent sessions — prevents unbounded bcrypt loop
  const sessions = await prisma.session.findMany({
    where: { userId, expiresAt: { gt: new Date() } },
    orderBy: { lastActive: 'desc' },
    take: 10,
  });

  for (const session of sessions) {
    const valid = await bcrypt.compare(refreshToken, session.refreshToken);
    if (valid) {
      // Update lastActive without blocking the return
      prisma.session
        .update({
          where: { id: session.id },
          data: { lastActive: new Date() },
        })
        .catch(() => {});
      return session;
    }
  }

  return null;
};;

export const rotateRefreshToken = async (
  sessionId: bigint,
  newRefreshToken: string,
) => {
  const hashed = await bcrypt.hash(newRefreshToken, 10);
  return prisma.session.update({
    where: { id: sessionId },
    data: { refreshToken: hashed, lastActive: new Date() },
  });
};

export const getUserSessions = async (userId: bigint) => {
  return prisma.session.findMany({
    where: { userId, expiresAt: { gt: new Date() } },
    select: {
      id: true,
      deviceInfo: true,
      ipAddress: true,
      lastActive: true,
      createdAt: true,
    },
  });
};

export const revokeSession = async (sessionId: bigint, userId: bigint) => {
  return prisma.session.deleteMany({ where: { id: sessionId, userId } });
};

export const revokeAllSessions = async (userId: bigint) => {
  return prisma.session.deleteMany({ where: { userId } });
};

export const cleanExpiredSessions = async () => {
  return prisma.session.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });
};
