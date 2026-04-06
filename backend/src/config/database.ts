import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const isProd = process.env.NODE_ENV === 'production';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
  max: isProd ? 20 : 5,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter,
    log: isProd ? ['error'] : ['warn', 'error'],
  });

if (!isProd) {
  globalForPrisma.prisma = prisma;
}
