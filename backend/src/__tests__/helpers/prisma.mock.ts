export const prismaMock: any = {
  user: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  post: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  comment: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  like: {
    findUnique: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
  },
  bookmark: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
  },
  reaction: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    upsert: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    groupBy: jest.fn(),
  },
  notification: {
    findMany: jest.fn(),
    create: jest.fn(),
    updateMany: jest.fn(),
    count: jest.fn(),
  },
  poll: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
  pollResponse: {
    upsert: jest.fn(),
    groupBy: jest.fn(),
  },
  report: {
    findMany: jest.fn(),
    create: jest.fn(),
    count: jest.fn(),
  },
  role: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
  userRole: {
    upsert: jest.fn(),
    deleteMany: jest.fn(),
  },
  admin: {
    findUnique: jest.fn(),
    upsert: jest.fn(),
    deleteMany: jest.fn(),
  },
  moderationQueue: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
  dailyMetrics: {
    findMany: jest.fn(),
    upsert: jest.fn(),
  },
  userPostRandomization: {
    findMany: jest.fn(),
    count: jest.fn(),
  },
  session: {
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    deleteMany: jest.fn(),
  },
  passkeyCredential: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  storage: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
  },
  userSettings: {
    findUnique: jest.fn(),
    create: jest.fn(),
    upsert: jest.fn(),
  },
  userActivityLog: {
    create: jest.fn(),
    groupBy: jest.fn(),
  },
  $transaction: jest.fn((fn: any) => fn(prismaMock)),
};

jest.mock('../../config/database', () => ({
  prisma: prismaMock,
}));
