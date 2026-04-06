import { prisma } from '../config/database';
import { parsePagination, buildMeta } from '../utils/pagination';

export const getUserById = async (id: bigint) => {
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      username: true,
      displayUsername: true,
      phoneNumber: true,
      image: true,
      profileImage: true,
      createdAt: true,
    },
  });
};

export const updateUser = async (
  id: bigint,
  data: { username?: string; profileImage?: string },
) => {
  return prisma.user.update({
    where: { id },
    data,
    select: {
      id: true,
      username: true,
      phoneNumber: true,
      profileImage: true,
      createdAt: true,
    },
  });
};

export const getUserProfile = async (id: bigint) => {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      username: true,
      displayUsername: true,
      image: true,
      profileImage: true,
      createdAt: true,
      _count: {
        select: {
          posts: true,
          comments: true,
          likes: true,
          followers: true,
          following: true,
        },
      },
    },
  });
  return user;
};

export const getUserSettings = async (userId: bigint) => {
  return prisma.userSettings.findUnique({ where: { userId } });
};

export const updateUserSettings = async (
  userId: bigint,
  data: { theme?: string; notificationsEnabled?: boolean },
) => {
  return prisma.userSettings.upsert({
    where: { userId },
    update: data,
    create: { userId, ...data },
  });
};

export const deleteUser = async (id: bigint) => {
  return prisma.user.delete({ where: { id } });
};

export const searchUsers = async (
  query: string,
  page?: string,
  limit?: string,
) => {
  const { page: p, limit: l, skip } = parsePagination(page, limit);
  const where = {
    OR: [
      { username: { contains: query, mode: 'insensitive' as const } },
      { name: { contains: query, mode: 'insensitive' as const } },
    ],
  };
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: l,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        username: true,
        displayUsername: true,
        image: true,
        profileImage: true,
      },
    }),
    prisma.user.count({ where }),
  ]);
  return { users, meta: buildMeta(p, l, total) };
};
