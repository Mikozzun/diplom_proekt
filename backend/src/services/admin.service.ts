import { prisma } from '../config/database';
import { parsePagination, buildMeta } from '../utils/pagination';

export const getAdminDashboard = async () => {
  const [totalUsers, totalPosts, totalComments, pendingModeration] =
    await Promise.all([
      prisma.user.count(),
      prisma.post.count(),
      prisma.comment.count(),
      prisma.moderationQueue.count({ where: { status: 'pending' } }),
    ]);

  return { totalUsers, totalPosts, totalComments, pendingModeration };
};

export const getAllUsers = async (page?: string, limit?: string) => {
  const { page: p, limit: l, skip } = parsePagination(page, limit);
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      skip,
      take: l,
      select: {
        id: true,
        username: true,
        phoneNumber: true,
        profileImage: true,
        createdAt: true,
        admin: true,
        userRoles: { include: { role: true } },
      },
    }),
    prisma.user.count(),
  ]);
  return { users, meta: buildMeta(p, l, total) };
};

export const assignRole = async (userId: bigint, roleName: string) => {
  let role = await prisma.role.findUnique({ where: { name: roleName } });
  if (!role) {
    role = await prisma.role.create({ data: { name: roleName } });
  }

  return prisma.userRole.upsert({
    where: { userId_roleId: { userId, roleId: role.id } },
    update: {},
    create: { userId, roleId: role.id },
  });
};

export const removeRole = async (userId: bigint, roleName: string) => {
  const role = await prisma.role.findUnique({ where: { name: roleName } });
  if (!role) return;
  return prisma.userRole.deleteMany({
    where: { userId, roleId: role.id },
  });
};

export const promoteToAdmin = async (userId: bigint) => {
  return prisma.admin.upsert({
    where: { userId },
    update: {},
    create: { userId },
  });
};

export const demoteAdmin = async (userId: bigint) => {
  return prisma.admin.deleteMany({ where: { userId } });
};

export const banUser = async (userId: bigint) => {
  await prisma.session.deleteMany({ where: { userId } });
  await prisma.userActivityLog.create({
    data: { userId, action: 'banned' },
  });
};

export const adminDeleteUser = async (userId: bigint) => {
  return prisma.user.delete({ where: { id: userId } });
};

export const adminDeletePost = async (postId: bigint) => {
  return prisma.post.delete({ where: { id: postId } });
};

export const adminBatchDeleteUsers = async (userIds: bigint[]) => {
  return prisma.user.deleteMany({ where: { id: { in: userIds } } });
};

export const adminBatchDeletePosts = async (postIds: bigint[]) => {
  return prisma.post.deleteMany({ where: { id: { in: postIds } } });
};

export const adminGetAllPosts = async (page?: string, limit?: string) => {
  const { page: p, limit: l, skip } = parsePagination(page, limit);
  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      skip,
      take: l,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { id: true, username: true } } },
    }),
    prisma.post.count(),
  ]);
  return { posts, meta: buildMeta(p, l, total) };
};
