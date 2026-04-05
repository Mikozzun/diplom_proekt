import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding database...');

  // 1. Create roles
  const roles = ['admin', 'moderator', 'user'];
  for (const name of roles) {
    await prisma.role.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  console.log('Roles created: admin, moderator, user');

  // 2. Create admin user
  const adminPasskey = await bcrypt.hash('admin123', 12);
  const adminUser = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      phoneNumber: '+1000000000',
      passkey: adminPasskey,
    },
  });
  console.log(`Admin user created: id=${adminUser.id}`);

  // 3. Link admin to Admin table
  await prisma.admin.upsert({
    where: { userId: adminUser.id },
    update: {},
    create: { userId: adminUser.id },
  });

  // 4. Assign admin role
  const adminRole = await prisma.role.findUnique({ where: { name: 'admin' } });
  if (adminRole) {
    await prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId: adminUser.id,
          roleId: adminRole.id,
        },
      },
      update: {},
      create: { userId: adminUser.id, roleId: adminRole.id },
    });
  }

  // 5. Create admin settings
  await prisma.userSettings.upsert({
    where: { userId: adminUser.id },
    update: {},
    create: { userId: adminUser.id },
  });

  // 6. Create a test user
  const testPasskey = await bcrypt.hash('test1234', 12);
  const testUser = await prisma.user.upsert({
    where: { username: 'testuser' },
    update: {},
    create: {
      username: 'testuser',
      phoneNumber: '+1000000001',
      passkey: testPasskey,
    },
  });
  console.log(`Test user created: id=${testUser.id}`);

  const userRole = await prisma.role.findUnique({ where: { name: 'user' } });
  if (userRole) {
    await prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId: testUser.id,
          roleId: userRole.id,
        },
      },
      update: {},
      create: { userId: testUser.id, roleId: userRole.id },
    });
  }

  await prisma.userSettings.upsert({
    where: { userId: testUser.id },
    update: {},
    create: { userId: testUser.id },
  });

  // 7. Seed a few posts
  const post1 = await prisma.post.create({
    data: {
      content: 'Welcome to Frogger! This is the first post.',
      userId: adminUser.id,
    },
  });
  const post2 = await prisma.post.create({
    data: {
      content: 'Hello everyone! Excited to be here.',
      userId: testUser.id,
    },
  });
  console.log(`Posts created: ${post1.id}, ${post2.id}`);

  // 8. Seed a comment
  await prisma.comment.create({
    data: {
      content: 'Great first post!',
      userId: testUser.id,
      postId: post1.id,
    },
  });
  console.log('Comment seeded');

  // 9. Seed a poll
  await prisma.poll.create({
    data: {
      question: 'What feature should we build next?',
      options: ['Dark mode', 'Direct messages', 'Image posts', 'Communities'],
      postId: post2.id,
    },
  });
  console.log('Poll seeded');

  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
