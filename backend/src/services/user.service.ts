import { prisma } from '../config/database';

export const getUserById = async (id: bigint) => {
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      username: true,
      phoneNumber: true,
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
      username: true,
      profileImage: true,
      createdAt: true,
      _count: { select: { posts: true, comments: true, likes: true } },
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
