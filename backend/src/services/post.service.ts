import { prisma } from '../config/database';
import { parsePagination, buildMeta } from '../utils/pagination';
import { renderMarkdown } from '../utils/markdown';

export const createPost = async (
  userId: bigint,
  data: {
    content?: string;
    imageUrl?: string;
    videoUrl?: string;
    isMarkdown?: boolean;
  },
) => {
  const contentHtml =
    data.isMarkdown && data.content ? renderMarkdown(data.content) : null;

  const post = await prisma.post.create({
    data: {
      content: data.content,
      contentHtml,
      isMarkdown: data.isMarkdown ?? false,
      imageUrl: data.imageUrl,
      videoUrl: data.videoUrl,
      userId,
    },
    include: {
      user: { select: { id: true, username: true, profileImage: true } },
      _count: { select: { comments: true, likes: true, reactions: true } },
    },
  });

  await prisma.userActivityLog.create({
    data: { userId, action: 'create_post' },
  });

  return post;
};

export const getPosts = async (page?: string, limit?: string) => {
  const { page: p, limit: l, skip } = parsePagination(page, limit);
  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      skip,
      take: l,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, username: true, profileImage: true } },
        _count: { select: { comments: true, likes: true, reactions: true } },
      },
    }),
    prisma.post.count(),
  ]);
  return { posts, meta: buildMeta(p, l, total) };
};

export const getPostById = async (id: bigint) => {
  return prisma.post.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, username: true, profileImage: true } },
      _count: { select: { comments: true, likes: true, reactions: true } },
      polls: true,
    },
  });
};

export const updatePost = async (
  id: bigint,
  userId: bigint,
  data: {
    content?: string;
    imageUrl?: string;
    videoUrl?: string;
    isMarkdown?: boolean;
  },
) => {
  const post = await prisma.post.findUnique({ where: { id } });
  if (!post || post.userId !== userId) throw new Error('Not authorized');

  const isMarkdown = data.isMarkdown ?? post.isMarkdown;
  const contentHtml =
    isMarkdown && data.content
      ? renderMarkdown(data.content)
      : data.content !== undefined
        ? null
        : post.contentHtml;

  return prisma.post.update({
    where: { id },
    data: {
      content: data.content,
      contentHtml,
      isMarkdown,
      imageUrl: data.imageUrl,
      videoUrl: data.videoUrl,
    },
    include: {
      user: { select: { id: true, username: true, profileImage: true } },
      _count: { select: { comments: true, likes: true, reactions: true } },
    },
  });
};

export const deletePost = async (id: bigint, userId: bigint) => {
  const post = await prisma.post.findUnique({ where: { id } });
  if (!post || post.userId !== userId) throw new Error('Not authorized');
  return prisma.post.delete({ where: { id } });
};

export const getUserPosts = async (
  userId: bigint,
  page?: string,
  limit?: string,
) => {
  const { page: p, limit: l, skip } = parsePagination(page, limit);
  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where: { userId },
      skip,
      take: l,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, username: true, profileImage: true } },
        _count: { select: { comments: true, likes: true, reactions: true } },
      },
    }),
    prisma.post.count({ where: { userId } }),
  ]);
  return { posts, meta: buildMeta(p, l, total) };
};

export const getRandomizedFeed = async (
  userId: bigint,
  page?: string,
  limit?: string,
) => {
  const { page: p, limit: l, skip } = parsePagination(page, limit);
  const randomized = await prisma.userPostRandomization.findMany({
    where: { userId },
    skip,
    take: l,
    orderBy: { randomOrder: 'asc' },
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

  const total = await prisma.userPostRandomization.count({
    where: { userId },
  });
  const posts = randomized.map((r) => r.post).filter(Boolean);

  return { posts, meta: buildMeta(p, l, total) };
};
