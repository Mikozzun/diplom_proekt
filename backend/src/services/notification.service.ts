import { prisma } from '../config/database';
import { parsePagination, buildMeta } from '../utils/pagination';

export const getUserNotifications = async (
  userId: bigint,
  page?: string,
  limit?: string,
) => {
  const { page: p, limit: l, skip } = parsePagination(page, limit);
  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      skip,
      take: l,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.notification.count({ where: { userId } }),
  ]);
  return { notifications, meta: buildMeta(p, l, total) };
};

export const markAsRead = async (id: bigint, userId: bigint) => {
  return prisma.notification.updateMany({
    where: { id, userId },
    data: { readAt: new Date() },
  });
};

export const markAllAsRead = async (userId: bigint) => {
  return prisma.notification.updateMany({
    where: { userId, readAt: null },
    data: { readAt: new Date() },
  });
};

export const getUnreadCount = async (userId: bigint) => {
  return prisma.notification.count({
    where: { userId, readAt: null },
  });
};

export const createNotification = async (
  userId: bigint,
  type: string,
  message: string,
) => {
  return prisma.notification.create({
    data: { userId, type, message },
  });
};
