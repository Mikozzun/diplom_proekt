import { prisma } from '../config/database';

export const toggleLike = async (postId: bigint, userId: bigint) => {
  const existing = await prisma.like.findUnique({
    where: { userId_postId: { userId, postId } },
  });

  if (existing) {
    await prisma.like.delete({ where: { id: existing.id } });
    return { liked: false };
  }

  await prisma.like.create({ data: { userId, postId } });

  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (post?.userId && post.userId !== userId) {
    await prisma.notification.create({
      data: {
        userId: post.userId,
        type: 'like',
        message: 'Someone liked your post',
      },
    });
  }

  return { liked: true };
};

export const toggleBookmark = async (postId: bigint, userId: bigint) => {
  const existing = await prisma.bookmark.findUnique({
    where: { userId_postId: { userId, postId } },
  });

  if (existing) {
    await prisma.bookmark.delete({ where: { id: existing.id } });
    return { bookmarked: false };
  }

  await prisma.bookmark.create({ data: { userId, postId } });
  return { bookmarked: true };
};

export const getUserBookmarks = async (userId: bigint) => {
  return prisma.bookmark.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: {
      post: {
        include: {
          user: { select: { id: true, username: true, profileImage: true } },
          _count: {
            select: { comments: true, likes: true, reactions: true },
          },
        },
      },
    },
  });
};

export const addReaction = async (
  postId: bigint,
  userId: bigint,
  reactionType: string,
) => {
  return prisma.reaction.upsert({
    where: {
      userId_postId_reactionType: { userId, postId, reactionType },
    },
    update: { reactionType },
    create: { userId, postId, reactionType },
  });
};

export const removeReaction = async (
  postId: bigint,
  userId: bigint,
  reactionType: string,
) => {
  return prisma.reaction.deleteMany({
    where: { userId, postId, reactionType },
  });
};

export const getPostReactions = async (postId: bigint) => {
  const reactions = await prisma.reaction.groupBy({
    by: ['reactionType'],
    where: { postId },
    _count: { reactionType: true },
  });
  return reactions.map((r) => ({
    type: r.reactionType,
    count: r._count.reactionType,
  }));
};
