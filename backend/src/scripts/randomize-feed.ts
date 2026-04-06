import { prisma } from '../config/database';

const fillMissingPosts = async (userId: bigint) => {
  await prisma.$executeRawUnsafe(
    `INSERT INTO user_post_randomization (user_id, post_id, random_order)
     SELECT $1, p.id, floor(random() * 2147483647)::int
     FROM posts p
     WHERE NOT EXISTS (
       SELECT 1 FROM user_post_randomization upr
       WHERE upr.user_id = $1 AND upr.post_id = p.id
     )`,
    userId,
  );
};

const reshuffleOrder = async (userId: bigint) => {
  await prisma.$executeRawUnsafe(
    `UPDATE user_post_randomization
     SET random_order = floor(random() * 2147483647)::int
     WHERE user_id = $1`,
    userId,
  );
};

const stampShuffledAt = async (userId: bigint) => {
  await prisma.user.update({
    where: { id: userId },
    data: { feedShuffledAt: new Date() },
  });
};

export const initFeedForUser = async (userId: bigint) => {
  await fillMissingPosts(userId);
  await stampShuffledAt(userId);
};

export const randomizeForUser = async (userId: bigint) => {
  await prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe(
      `SELECT pg_advisory_xact_lock($1)`,
      userId,
    );
    await fillMissingPosts(userId);
    await reshuffleOrder(userId);
  });
  await stampShuffledAt(userId);
};

export const reshuffleIfNeeded = async (
  userId: bigint,
  sessionStartedAt?: Date,
) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { feedShuffledAt: true },
  });
  const lastShuffle = user?.feedShuffledAt;
  const sessionStart = sessionStartedAt ?? new Date(0);
  if (lastShuffle && lastShuffle >= sessionStart) {
    await fillMissingPosts(userId);
    return;
  }
  await randomizeForUser(userId);
};

export const propagateNewPost = async (postId: bigint) => {
  await prisma.$executeRawUnsafe(
    `INSERT INTO user_post_randomization (user_id, post_id, random_order)
     SELECT u.id, $1, floor(random() * 2147483647)::int
     FROM users u
     WHERE NOT EXISTS (
       SELECT 1 FROM user_post_randomization upr
       WHERE upr.user_id = u.id AND upr.post_id = $1
     )`,
    postId,
  );
};

export const randomizeAll = async () => {
  const users = await prisma.user.findMany({ select: { id: true } });
  let total = 0;
  for (const user of users) {
    await randomizeForUser(user.id);
    const count = await prisma.userPostRandomization.count({
      where: { userId: user.id },
    });
    total += count;
    process.stdout.write(`  User ${user.id}: ${count} posts randomized\n`);
  }
  return { users: users.length, totalEntries: total };
};

const isDirectRun =
  process.argv[1]?.endsWith('randomize-feed.ts') ||
  process.argv[1]?.endsWith('randomize-feed.js');
if (isDirectRun) {
  (async () => {
    const args = process.argv.slice(2);
    const userIdx = args.indexOf('--user');
    const postIdx = args.indexOf('--post');
    try {
      if (userIdx !== -1 && args[userIdx + 1]) {
        const uid = BigInt(args[userIdx + 1]);
        const user = await prisma.user.findUnique({ where: { id: uid } });
        if (!user) {
          console.error(`User ${uid} not found.`);
          process.exit(1);
        }
        console.log(`Randomizing feed for user ${uid}...`);
        await randomizeForUser(uid);
        const count = await prisma.userPostRandomization.count({
          where: { userId: uid },
        });
        console.log(`Done — ${count} posts randomized.`);
      } else if (postIdx !== -1 && args[postIdx + 1]) {
        const pid = BigInt(args[postIdx + 1]);
        const post = await prisma.post.findUnique({ where: { id: pid } });
        if (!post) {
          console.error(`Post ${pid} not found.`);
          process.exit(1);
        }
        console.log(`Propagating post ${pid} to all users...`);
        await propagateNewPost(pid);
        console.log('Done — post propagated to all user feeds.');
      } else {
        console.log('Randomizing feed for ALL users...');
        const result = await randomizeAll();
        console.log(
          `Done — ${result.users} users, ${result.totalEntries} total entries.`,
        );
      }
    } catch (err) {
      console.error('Randomization failed:', err);
      process.exit(1);
    } finally {
      await prisma.$disconnect();
    }
  })();
}
