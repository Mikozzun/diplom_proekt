/**
 * Feed Service
 *
 * Provides a per-user randomized feed that is different on every request.
 * The algorithm:
 *   1. Ensure the user has a randomization entry for every post
 *   2. Re-shuffle all order values (one UPDATE via raw SQL — fast)
 *   3. Return the paginated, freshly-shuffled feed
 *
 * This guarantees that regardless of post age, type, reactions,
 * comments, or subscriptions — the order is always unique and random
 * for each user on each page load.
 */

import { prisma } from '../config/database';
import { parsePagination, buildMeta } from '../utils/pagination';
import {
  randomizeForUser,
  propagateNewPost,
} from '../scripts/randomize-feed';

/**
 * Get a freshly randomized feed for a specific user.
 * Every call produces a new random order.
 */
export const getRandomizedFeed = async (
  userId: bigint,
  page?: string,
  limit?: string,
) => {
  // 1. Ensure user has entries for all posts + reshuffle order values
  await randomizeForUser(userId);

  // 2. Fetch the freshly shuffled page
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

/**
 * Called after a new post is created — inserts randomization
 * entries for every user so the post enters all feeds.
 */
export const onPostCreated = async (postId: bigint) => {
  await propagateNewPost(postId);
};

/**
 * Called after a post is deleted — clean up is handled by
 * ON DELETE CASCADE on the FK, but we can call this explicitly
 * if needed.
 */
export const onPostDeleted = async (postId: bigint) => {
  await prisma.userPostRandomization.deleteMany({
    where: { postId },
  });
};
