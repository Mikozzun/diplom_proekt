import bcrypt from 'bcryptjs';
import { prisma } from '../config/database';
import { generateTokenPair } from '../utils/jwt';
import { createSession } from './session.service';

export const register = async (
  username: string,
  phoneNumber: string,
  passkey: string,
) => {
  const existing = await prisma.user.findFirst({
    where: { OR: [{ username }, { phoneNumber }] },
  });
  if (existing) throw new Error('User already exists');

  const hashed = await bcrypt.hash(passkey, 12);
  const user = await prisma.user.create({
    data: { username, phoneNumber, passkey: hashed },
    select: { id: true, username: true, phoneNumber: true, createdAt: true },
  });

  await prisma.userSettings.create({ data: { userId: user.id } });
  await prisma.userActivityLog.create({
    data: { userId: user.id, action: 'register' },
  });

  return user;
};

export const login = async (
  username: string,
  passkey: string,
  deviceInfo?: string,
  ipAddress?: string,
) => {
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) throw new Error('Invalid credentials');

  const valid = await bcrypt.compare(passkey, user.passkey);
  if (!valid) throw new Error('Invalid credentials');

  const tokens = generateTokenPair(user.id.toString());
  const { session } = await createSession(
    user.id,
    tokens.refreshToken,
    deviceInfo,
    ipAddress,
  );

  await prisma.userActivityLog.create({
    data: { userId: user.id, action: 'login' },
  });

  return {
    user: {
      id: user.id,
      username: user.username,
      profileImage: user.profileImage,
    },
    ...tokens,
  };
};

export const loginWithClerk = async (clerkId: string) => {
  let user = await prisma.user.findUnique({ where: { clerkId } });
  if (!user) return null;

  const tokens = generateTokenPair(user.id.toString());

  await prisma.userActivityLog.create({
    data: { userId: user.id, action: 'clerk_login' },
  });

  return {
    user: {
      id: user.id,
      username: user.username,
      profileImage: user.profileImage,
    },
    ...tokens,
  };
};

export const syncClerkUser = async (
  clerkId: string,
  username: string,
  phoneNumber: string,
) => {
  let user = await prisma.user.findUnique({ where: { clerkId } });
  if (user) return user;

  const hashed = await bcrypt.hash(clerkId, 12);
  user = await prisma.user.create({
    data: { username, phoneNumber, passkey: hashed, clerkId },
  });

  await prisma.userSettings.create({ data: { userId: user.id } });
  return user;
};
