import { prisma } from '../config/database';
import { parsePagination, buildMeta } from '../utils/pagination';

export const createReport = async (
  userId: bigint,
  reportType: string,
  description?: string,
) => {
  return prisma.report.create({
    data: { userId, reportType, description },
  });
};

export const getReports = async (page?: string, limit?: string) => {
  const { page: p, limit: l, skip } = parsePagination(page, limit);
  const [reports, total] = await Promise.all([
    prisma.report.findMany({
      skip,
      take: l,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, username: true } },
      },
    }),
    prisma.report.count(),
  ]);
  return { reports, meta: buildMeta(p, l, total) };
};
