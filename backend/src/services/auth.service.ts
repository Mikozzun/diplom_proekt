import bcrypt from 'bcryptjs';
import { prisma } from '../config/database';
import { generateTokenPair } from '../utils/jwt';
import { createSession } from './session.service';

// Legacy registration — Better Auth handles this via /api/auth/sign-up/email
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
    data: {
      name: username,
      email: `${username}@placeholder.local`,
      username,
      phoneNumber,
      passkey: hashed,
    },
    select: { id: true, username: true, phoneNumber: true, createdAt: true },
  });

  await prisma.userSettings.create({ data: { userId: user.id } });
  await prisma.userActivityLog.create({
    data: { userId: user.id, action: 'register' },
  });

  return user;
};

// Legacy login — Better Auth handles this via /api/auth/sign-in/email
export const login = async (
  username: string,
  passkey: string,
  deviceInfo?: string,
  ipAddress?: string,
) => {
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user || !user.passkey) throw new Error('Invalid credentials');

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
