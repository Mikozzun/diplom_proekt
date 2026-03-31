import { prisma } from '../config/database';

export const createStorageEntry = async (
  userId: bigint,
  data: {
    fileName: string;
    fileType: string;
    fileSize: bigint;
    fileUrl: string;
  },
) => {
  return prisma.storage.create({
    data: { ...data, userId },
  });
};

export const getUserFiles = async (userId: bigint) => {
  return prisma.storage.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
};

export const deleteFile = async (id: bigint, userId: bigint) => {
  const file = await prisma.storage.findUnique({ where: { id } });
  if (!file || file.userId !== userId) throw new Error('Not authorized');
  return prisma.storage.delete({ where: { id } });
};
