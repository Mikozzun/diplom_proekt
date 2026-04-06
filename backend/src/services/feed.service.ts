import { prisma } from '../config/database';
import { parsePagination, buildMeta } from '../utils/pagination';
import {
  reshuffleIfNeeded,
  propagateNewPost,
} from '../scripts/randomize-feed';

export const getRandomizedFeed = async (
  userId: bigint,
  page?: string,
  limit?: string,
  sessionStartedAt?: Date,
) => {
  await reshuffleIfNeeded(userId, sessionStartedAt);
  const { page: p, limit: l, skip } = parsePagination(page, limit);
  const [rows, total] = await Promise.all([
    prisma.userPostRandomization.findMany({
      where: { userId },
      skip,
      take: l,
      orderBy: { randomOrder: 'asc' },
      include: {
        post: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                profileImage: true,
                name: true,
              },
            },
            _count: {
              select: { comments: true, likes: true, reactions: true },
            },
          },
        },
      },
    }),
    prisma.userPostRandomization.count({ where: { userId } }),
  ]);
  const posts = rows.map((r) => r.post).filter(Boolean);
  return { posts, meta: buildMeta(p, l, total) };
};

export const onPostCreated = async (postId: bigint) => {
  await propagateNewPost(postId);
};

export const onPostDeleted = async (postId: bigint) => {
  await prisma.userPostRandomization.deleteMany({
    where: { postId },
  });
};
