import { prisma } from '../config/database';

export const getDailyMetrics = async (startDate: Date, endDate: Date) => {
  return prisma.dailyMetrics.findMany({
    where: { date: { gte: startDate, lte: endDate } },
    orderBy: { date: 'asc' },
  });
};

export const recordDailyMetrics = async () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [newUsers, postsCreated, commentsMade] = await Promise.all([
    prisma.user.count({
      where: { createdAt: { gte: today, lt: tomorrow } },
    }),
    prisma.post.count({
      where: { createdAt: { gte: today, lt: tomorrow } },
    }),
    prisma.comment.count({
      where: { createdAt: { gte: today, lt: tomorrow } },
    }),
  ]);

  const activeUsers = await prisma.userActivityLog.groupBy({
    by: ['userId'],
    where: { timestamp: { gte: today, lt: tomorrow } },
  });

  return prisma.dailyMetrics.upsert({
    where: { date: today },
    update: {
      newUsers,
      postsCreated,
      commentsMade,
      activeUsers: activeUsers.length,
    },
    create: {
      date: today,
      newUsers,
      postsCreated,
      commentsMade,
      activeUsers: activeUsers.length,
    },
  });
};
