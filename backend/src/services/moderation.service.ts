import { prisma } from '../config/database';
import { parsePagination, buildMeta } from '../utils/pagination';

export const addToQueue = async (contentType: string, contentId: bigint) => {
  return prisma.moderationQueue.create({
    data: { contentType, contentId },
  });
};

export const getModerationQueue = async (
  status?: string,
  page?: string,
  limit?: string,
) => {
  const { page: p, limit: l, skip } = parsePagination(page, limit);
  const where = status ? { status } : {};
  const [items, total] = await Promise.all([
    prisma.moderationQueue.findMany({
      where,
      skip,
      take: l,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.moderationQueue.count({ where }),
  ]);
  return { items, meta: buildMeta(p, l, total) };
};

export const updateModerationStatus = async (id: bigint, status: string) => {
  return prisma.moderationQueue.update({
    where: { id },
    data: { status },
  });
};

export const resolveModeration = async (
  id: bigint,
  action: 'approve' | 'reject',
) => {
  const item = await prisma.moderationQueue.findUnique({ where: { id } });
  if (!item) throw new Error('Item not found');

  if (action === 'reject') {
    if (item.contentType === 'post') {
      await prisma.post.delete({ where: { id: item.contentId } });
    } else if (item.contentType === 'comment') {
      await prisma.comment.delete({ where: { id: item.contentId } });
    }
  }

  return prisma.moderationQueue.update({
    where: { id },
    data: { status: action === 'approve' ? 'approved' : 'rejected' },
  });
};
