import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import * as passkeyUtils from '../utils/passkey';
import { generateTokenPair } from '../utils/jwt';
import { createSession } from '../services/session.service';
import { sendSuccess, sendError } from '../utils/response';

const challengeStore = new Map<string, string>();

export const startRegistration = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.userId!;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      sendError(res, 'User not found', 404);
      return;
    }

    const existing = await prisma.passkeyCredential.findMany({
      where: { userId },
    });

    const options = await passkeyUtils.getRegistrationOptions(
      userId.toString(),
      user.username,
      existing.map((c) => ({
        credentialId: c.credentialId,
        publicKey: c.publicKey,
        counter: Number(c.counter),
        transports: c.transports,
      })),
    );

    challengeStore.set(userId.toString(), options.challenge);
    sendSuccess(res, options);
  } catch (err) {
    next(err);
  }
};

export const finishRegistration = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.userId!;
    const challenge = challengeStore.get(userId.toString());
    if (!challenge) {
      sendError(res, 'No challenge found', 400);
      return;
    }

    const verification = await passkeyUtils.verifyRegistration(
      req.body,
      challenge,
    );

    if (!verification.verified || !verification.registrationInfo) {
      sendError(res, 'Verification failed', 400);
      return;
    }

    const { credential } = verification.registrationInfo;

    await prisma.passkeyCredential.create({
      data: {
        userId,
        credentialId: credential.id,
        publicKey: Buffer.from(credential.publicKey).toString('base64'),
        counter: BigInt(credential.counter),
        deviceType: verification.registrationInfo.credentialDeviceType,
        backedUp: verification.registrationInfo.credentialBackedUp,
      },
    });

    challengeStore.delete(userId.toString());
    sendSuccess(res, { verified: true });
  } catch (err) {
    next(err);
  }
};

export const startAuthentication = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { username } = req.body;
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) {
      sendError(res, 'User not found', 404);
      return;
    }

    const credentials = await prisma.passkeyCredential.findMany({
      where: { userId: user.id },
    });

    if (credentials.length === 0) {
      sendError(res, 'No passkeys registered', 400);
      return;
    }

    const options = await passkeyUtils.getAuthenticationOptions(
      credentials.map((c) => ({
        credentialId: c.credentialId,
        publicKey: c.publicKey,
        counter: Number(c.counter),
        transports: c.transports,
      })),
    );

    challengeStore.set(user.id.toString(), options.challenge);
    sendSuccess(res, { ...options, userId: user.id });
  } catch (err) {
    next(err);
  }
};

export const finishAuthentication = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { userId: userIdStr, ...response } = req.body;
    const userId = BigInt(userIdStr);
    const challenge = challengeStore.get(userId.toString());
    if (!challenge) {
      sendError(res, 'No challenge found', 400);
      return;
    }

    const credential = await prisma.passkeyCredential.findUnique({
      where: { credentialId: response.id },
    });

    if (!credential || credential.userId !== userId) {
      sendError(res, 'Credential not found', 400);
      return;
    }

    const verification = await passkeyUtils.verifyAuthentication(
      response,
      challenge,
      {
        credentialId: credential.credentialId,
        publicKey: credential.publicKey,
        counter: Number(credential.counter),
        transports: credential.transports,
      },
    );

    if (!verification.verified) {
      sendError(res, 'Authentication failed', 401);
      return;
    }

    await prisma.passkeyCredential.update({
      where: { id: credential.id },
      data: {
        counter: BigInt(verification.authenticationInfo.newCounter),
      },
    });

    const tokens = generateTokenPair(userId.toString());
    const deviceInfo = req.headers['user-agent'];
    await createSession(userId, tokens.refreshToken, deviceInfo, req.ip);

    challengeStore.delete(userId.toString());

    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    sendSuccess(res, { accessToken: tokens.accessToken });
  } catch (err) {
    next(err);
  }
};
