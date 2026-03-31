import { prisma } from '../config/database';
import { parsePagination, buildMeta } from '../utils/pagination';

export const createComment = async (
  postId: bigint,
  userId: bigint,
  content: string,
) => {
  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) throw new Error('Post not found');

  const comment = await prisma.comment.create({
    data: { content, postId, userId },
    include: {
      user: { select: { id: true, username: true, profileImage: true } },
    },
  });

  if (post.userId && post.userId !== userId) {
    await prisma.notification.create({
      data: {
        userId: post.userId,
        type: 'comment',
        message: `New comment on your post`,
      },
    });
  }

  return comment;
};

export const getPostComments = async (
  postId: bigint,
  page?: string,
  limit?: string,
) => {
  const { page: p, limit: l, skip } = parsePagination(page, limit);
  const [comments, total] = await Promise.all([
    prisma.comment.findMany({
      where: { postId },
      skip,
      take: l,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, username: true, profileImage: true } },
      },
    }),
    prisma.comment.count({ where: { postId } }),
  ]);
  return { comments, meta: buildMeta(p, l, total) };
};

export const updateComment = async (
  id: bigint,
  userId: bigint,
  content: string,
) => {
  const comment = await prisma.comment.findUnique({ where: { id } });
  if (!comment || comment.userId !== userId) throw new Error('Not authorized');

  return prisma.comment.update({
    where: { id },
    data: { content, updatedAt: new Date() },
    include: {
      user: { select: { id: true, username: true, profileImage: true } },
    },
  });
};

export const deleteComment = async (id: bigint, userId: bigint) => {
  const comment = await prisma.comment.findUnique({ where: { id } });
  if (!comment || comment.userId !== userId) throw new Error('Not authorized');
  return prisma.comment.delete({ where: { id } });
};
