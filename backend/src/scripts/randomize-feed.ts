/**
 * Feed Randomization Script
 *
 * Generates unique random sort orders in the user_post_randomization table.
 * Each user gets every post assigned a random order value, producing a
 * fully individualized feed.
 *
 * Usage:
 *   npm run randomize-feed              # all users × all posts
 *   npm run randomize-feed -- --user 42 # single user
 *   npm run randomize-feed -- --post 99 # propagate a new post to all users
 */

import { prisma } from '../config/database';

const BATCH_SIZE = 500;

/**
 * Generate a cryptographically-influenced random integer.
 * Uses Math.random which is sufficient for feed ordering (not security).
 */
const randomOrder = () => Math.floor(Math.random() * 2_147_483_647);

/**
 * Shuffle feed for a single user: upserts a randomization row
 * for every post the user doesn't already have, then re-randomises
 * the order of ALL their rows so even existing posts get a fresh position.
 */
const randomizeForUser = async (userId: bigint) => {
  // 1. Get all post IDs
  const posts = await prisma.post.findMany({
    select: { id: true },
  });

  if (posts.length === 0) return 0;

  // 2. Get existing randomization entries for this user
  const existing = await prisma.userPostRandomization.findMany({
    where: { userId },
    select: { postId: true },
  });
  const existingPostIds = new Set(existing.map((e) => e.postId));

  // 3. Insert missing post entries in batches
  const missing = posts.filter((p) => !existingPostIds.has(p.id));
  for (let i = 0; i < missing.length; i += BATCH_SIZE) {
    const batch = missing.slice(i, i + BATCH_SIZE);
    await prisma.userPostRandomization.createMany({
      data: batch.map((p) => ({
        userId,
        postId: p.id,
        randomOrder: randomOrder(),
      })),
      skipDuplicates: true,
    });
  }

  // 4. Re-randomize ALL order values for this user
  await prisma.$executeRawUnsafe(
    `UPDATE user_post_randomization
     SET random_order = floor(random() * 2147483647)::int
     WHERE user_id = $1`,
    userId,
  );

  return posts.length;
};

/**
 * Propagate a newly created post to ALL users.
 * Inserts a randomization entry for every user so the post
 * appears somewhere in everyone's feed.
 */
const propagateNewPost = async (postId: bigint) => {
  const users = await prisma.user.findMany({ select: { id: true } });

  for (let i = 0; i < users.length; i += BATCH_SIZE) {
    const batch = users.slice(i, i + BATCH_SIZE);
    await prisma.userPostRandomization.createMany({
      data: batch.map((u) => ({
        userId: u.id,
        postId,
        randomOrder: randomOrder(),
      })),
      skipDuplicates: true,
    });
  }

  return users.length;
};

/**
 * Full rebuild: generate randomization entries for ALL users × ALL posts.
 */
const randomizeAll = async () => {
  const users = await prisma.user.findMany({ select: { id: true } });
  let total = 0;

  for (const user of users) {
    const count = await randomizeForUser(user.id);
    total += count;
    process.stdout.write(`  User ${user.id}: ${count} posts randomized\n`);
  }

  return { users: users.length, totalEntries: total };
};

/**
 * Re-shuffle a single user's feed (new random_order for every row).
 * Called by the feed service on each feed request so every
 * page load feels fresh.
 */
export const reshuffleUserFeed = async (userId: bigint) => {
  // Ensure user has entries for all posts first
  await randomizeForUser(userId);

  // Re-randomize (already done inside randomizeForUser, but this
  // is the public export for on-demand use)
};

export { randomizeForUser, propagateNewPost, randomizeAll };

/* ── CLI entry point ────────────────────────────────────── */
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
        const count = await randomizeForUser(uid);
        console.log(`Done — ${count} posts randomized.`);
      } else if (postIdx !== -1 && args[postIdx + 1]) {
        const pid = BigInt(args[postIdx + 1]);
        const post = await prisma.post.findUnique({ where: { id: pid } });
        if (!post) {
          console.error(`Post ${pid} not found.`);
          process.exit(1);
        }
        console.log(`Propagating post ${pid} to all users...`);
        const count = await propagateNewPost(pid);
        console.log(`Done — post added to ${count} user feeds.`);
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
