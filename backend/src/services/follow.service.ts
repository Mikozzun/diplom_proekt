import { prisma } from '../config/database';
import { parsePagination, buildMeta } from '../utils/pagination';
import * as notificationService from './notification.service';

export const toggleFollow = async (followerId: bigint, followingId: bigint) => {
  if (followerId === followingId) {
    throw new Error('Cannot follow yourself');
  }

  const existing = await prisma.follow.findUnique({
    where: { followerId_followingId: { followerId, followingId } },
  });

  if (existing) {
    await prisma.follow.delete({ where: { id: existing.id } });
    return { followed: false };
  }

  await prisma.follow.create({ data: { followerId, followingId } });

  await notificationService.createNotification(
    followingId,
    'follow',
    'Someone started following you',
  );

  return { followed: true };
};

export const getFollowers = async (
  userId: bigint,
  page?: string,
  limit?: string,
) => {
  const { page: p, limit: l, skip } = parsePagination(page, limit);
  const [followers, total] = await Promise.all([
    prisma.follow.findMany({
      where: { followingId: userId },
      skip,
      take: l,
      orderBy: { createdAt: 'desc' },
      include: {
        follower: {
          select: {
            id: true,
            name: true,
            username: true,
            profileImage: true,
          },
        },
      },
    }),
    prisma.follow.count({ where: { followingId: userId } }),
  ]);
  return {
    followers: followers.map((f) => f.follower),
    meta: buildMeta(p, l, total),
  };
};

export const getFollowing = async (
  userId: bigint,
  page?: string,
  limit?: string,
) => {
  const { page: p, limit: l, skip } = parsePagination(page, limit);
  const [following, total] = await Promise.all([
    prisma.follow.findMany({
      where: { followerId: userId },
      skip,
      take: l,
      orderBy: { createdAt: 'desc' },
      include: {
        following: {
          select: {
            id: true,
            name: true,
            username: true,
            profileImage: true,
          },
        },
      },
    }),
    prisma.follow.count({ where: { followerId: userId } }),
  ]);
  return {
    following: following.map((f) => f.following),
    meta: buildMeta(p, l, total),
  };
};

export const isFollowing = async (followerId: bigint, followingId: bigint) => {
  const follow = await prisma.follow.findUnique({
    where: { followerId_followingId: { followerId, followingId } },
  });
  return !!follow;
};
