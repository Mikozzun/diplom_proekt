import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
  VerifiedRegistrationResponse,
  VerifiedAuthenticationResponse,
} from '@simplewebauthn/server';
import type {
  RegistrationResponseJSON,
  AuthenticationResponseJSON,
  AuthenticatorTransportFuture,
} from '@simplewebauthn/types';
import { env } from '../config/env';

const rpID = env.rpId;
const rpName = env.rpName;
const origin = env.rpOrigin;

interface StoredCredential {
  credentialId: string;
  publicKey: string;
  counter: number;
  transports?: string[];
}

export const getRegistrationOptions = async (
  userId: string,
  username: string,
  existingCredentials: StoredCredential[] = [],
) => {
  return generateRegistrationOptions({
    rpName,
    rpID,
    userName: username,
    userID: new TextEncoder().encode(userId),
    attestationType: 'none',
    excludeCredentials: existingCredentials.map((c) => ({
      id: c.credentialId,
      transports: c.transports as AuthenticatorTransportFuture[],
    })),
    authenticatorSelection: {
      residentKey: 'preferred',
      userVerification: 'preferred',
    },
  });
};

export const verifyRegistration = async (
  response: RegistrationResponseJSON,
  expectedChallenge: string,
): Promise<VerifiedRegistrationResponse> => {
  return verifyRegistrationResponse({
    response,
    expectedChallenge,
    expectedOrigin: origin,
    expectedRPID: rpID,
  });
};

export const getAuthenticationOptions = async (
  credentials: StoredCredential[] = [],
) => {
  return generateAuthenticationOptions({
    rpID,
    allowCredentials: credentials.map((c) => ({
      id: c.credentialId,
      transports: c.transports as AuthenticatorTransportFuture[],
    })),
    userVerification: 'preferred',
  });
};

export const verifyAuthentication = async (
  response: AuthenticationResponseJSON,
  expectedChallenge: string,
  credential: StoredCredential,
): Promise<VerifiedAuthenticationResponse> => {
  return verifyAuthenticationResponse({
    response,
    expectedChallenge,
    expectedOrigin: origin,
    expectedRPID: rpID,
    credential: {
      id: credential.credentialId,
      publicKey: new Uint8Array(Buffer.from(credential.publicKey, 'base64')),
      counter: credential.counter,
      transports: credential.transports as AuthenticatorTransportFuture[],
    },
  });
};
