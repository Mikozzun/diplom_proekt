import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { WebAuthnService } from '../../../src/auth/webauthn.service';
import { PrismaService } from '../../../prisma/prisma.service';
import * as simplewebauthn from '@simplewebauthn/server';

// Mock the entire @simplewebauthn/server module
jest.mock('@simplewebauthn/server', () => ({
  generateRegistrationOptions: jest.fn(),
  verifyRegistrationResponse: jest.fn(),
  generateAuthenticationOptions: jest.fn(),
  verifyAuthenticationResponse: jest.fn(),
}));

describe('WebAuthnService', () => {
  let service: WebAuthnService;
  let prisma: {
    user: {
      findFirst: jest.Mock;
      create: jest.Mock;
    };
    credential: {
      create: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
    };
  };

  const mockGenerateRegOpts =
    simplewebauthn.generateRegistrationOptions as jest.Mock;
  const mockVerifyRegResp =
    simplewebauthn.verifyRegistrationResponse as jest.Mock;
  const mockGenerateAuthOpts =
    simplewebauthn.generateAuthenticationOptions as jest.Mock;
  const mockVerifyAuthResp =
    simplewebauthn.verifyAuthenticationResponse as jest.Mock;

  beforeEach(async () => {
    prisma = {
      user: {
        findFirst: jest.fn(),
        create: jest.fn(),
      },
      credential: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WebAuthnService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<WebAuthnService>(WebAuthnService);

    jest.clearAllMocks();
  });

  // ──────────────────────────────────────────
  //  REGISTRATION
  // ──────────────────────────────────────────

  describe('generateRegistrationOptions', () => {
    it('should generate options for a new user (no existing credentials)', async () => {
      prisma.user.findFirst.mockResolvedValue(null);
      mockGenerateRegOpts.mockResolvedValue({
        challenge: 'test-challenge-abc',
        rp: { name: 'Frogger', id: 'localhost' },
        user: { id: '+1234567890', name: '+1234567890' },
      });

      const result = await service.generateRegistrationOptions('+1234567890');

      expect(result.challenge).toBe('test-challenge-abc');
      expect(mockGenerateRegOpts).toHaveBeenCalledWith(
        expect.objectContaining({
          rpName: 'Frogger',
          rpID: 'localhost',
          userName: '+1234567890',
          attestationType: 'none',
          excludeCredentials: [],
        }),
      );
    });

    it('should exclude existing credentials for a returning user', async () => {
      prisma.user.findFirst.mockResolvedValue({
        id: 1n,
        phoneNumber: '+1234567890',
        credentials: [
          {
            credentialId: 'cred-1',
            transports: ['internal', 'hybrid'],
          },
        ],
      });
      mockGenerateRegOpts.mockResolvedValue({
        challenge: 'test-challenge',
      });

      await service.generateRegistrationOptions('+1234567890');

      expect(mockGenerateRegOpts).toHaveBeenCalledWith(
        expect.objectContaining({
          excludeCredentials: [
            {
              id: 'cred-1',
              type: 'public-key',
              transports: ['internal', 'hybrid'],
            },
          ],
        }),
      );
    });
  });

  describe('verifyRegistration', () => {
    const mockCredential = {
      id: 'credential-id-base64',
      rawId: 'raw-id',
      type: 'public-key',
      response: {
        attestationObject: 'attestation-base64',
        clientDataJSON: 'client-data-base64',
        transports: ['internal'],
      },
    };

    it('should throw if no challenge exists for the phone number', async () => {
      // No challenge stored (empty map)
      await expect(
        service.verifyRegistration('+9999999999', mockCredential as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('should create user and credential on successful verification', async () => {
      // Store a challenge first
      mockGenerateRegOpts.mockResolvedValue({ challenge: 'reg-challenge' });
      prisma.user.findFirst.mockResolvedValue(null); // no existing user
      await service.generateRegistrationOptions('+1234567890');

      // Now verify
      const verificationResult = {
        verified: true,
        registrationInfo: {
          credential: {
            id: 'new-cred-id',
            publicKey: new Uint8Array([1, 2, 3, 4]),
            counter: 0,
          },
        },
      };
      mockVerifyRegResp.mockResolvedValue(verificationResult);

      // User doesn't exist yet → will be created
      prisma.user.findFirst.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({
        id: 42n,
        phoneNumber: '+1234567890',
        username: '+1234567890',
      });
      prisma.credential.create.mockResolvedValue({});

      const result = await service.verifyRegistration(
        '+1234567890',
        mockCredential as any,
      );

      expect(result.verified).toBe(true);
      expect(result.userId).toBe('42');
      expect(prisma.user.create).toHaveBeenCalled();
      expect(prisma.credential.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 42n,
          credentialId: 'new-cred-id',
          counter: 0n,
        }),
      });
    });

    it('should use existing user if already registered', async () => {
      // Store a challenge
      mockGenerateRegOpts.mockResolvedValue({ challenge: 'reg-challenge-2' });
      prisma.user.findFirst.mockResolvedValue(null);
      await service.generateRegistrationOptions('+1234567890');

      const verificationResult = {
        verified: true,
        registrationInfo: {
          credential: {
            id: 'cred-2',
            publicKey: new Uint8Array([5, 6, 7]),
            counter: 0,
          },
        },
      };
      mockVerifyRegResp.mockResolvedValue(verificationResult);

      const existingUser = {
        id: 10n,
        phoneNumber: '+1234567890',
        username: '+1234567890',
      };
      prisma.user.findFirst.mockResolvedValue(existingUser);
      prisma.credential.create.mockResolvedValue({});

      const result = await service.verifyRegistration(
        '+1234567890',
        mockCredential as any,
      );

      expect(result.userId).toBe('10');
      expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it('should throw when simplewebauthn verification fails', async () => {
      // Store challenge
      mockGenerateRegOpts.mockResolvedValue({ challenge: 'fail-challenge' });
      prisma.user.findFirst.mockResolvedValue(null);
      await service.generateRegistrationOptions('+1234567890');

      mockVerifyRegResp.mockRejectedValue(new Error('Invalid attestation'));

      await expect(
        service.verifyRegistration('+1234567890', mockCredential as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw when verification.verified is false', async () => {
      mockGenerateRegOpts.mockResolvedValue({ challenge: 'no-verify' });
      prisma.user.findFirst.mockResolvedValue(null);
      await service.generateRegistrationOptions('+1234567890');

      mockVerifyRegResp.mockResolvedValue({
        verified: false,
        registrationInfo: null,
      });

      await expect(
        service.verifyRegistration('+1234567890', mockCredential as any),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ──────────────────────────────────────────
  //  AUTHENTICATION
  // ──────────────────────────────────────────

  describe('generateAuthenticationOptions', () => {
    it('should generate discoverable credential options', async () => {
      mockGenerateAuthOpts.mockResolvedValue({
        challenge: 'auth-challenge-123',
        allowCredentials: [],
      });

      const result = await service.generateAuthenticationOptions();

      expect(result.challenge).toBe('auth-challenge-123');
      expect(mockGenerateAuthOpts).toHaveBeenCalledWith(
        expect.objectContaining({
          rpID: 'localhost',
          userVerification: 'preferred',
          allowCredentials: [],
        }),
      );
    });
  });

  describe('verifyAuthentication', () => {
    const mockAuthCredential = {
      id: 'stored-cred-id',
      rawId: 'raw-id',
      type: 'public-key',
      response: {
        authenticatorData: 'auth-data',
        clientDataJSON: Buffer.from(
          JSON.stringify({ challenge: 'auth-challenge' }),
        ).toString('base64url'),
        signature: 'signature',
      },
    };

    it('should throw if credential not found in database', async () => {
      prisma.credential.findUnique.mockResolvedValue(null);

      await expect(
        service.verifyAuthentication(mockAuthCredential as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('should authenticate successfully and update counter', async () => {
      const storedCred = {
        id: 1n,
        credentialId: 'stored-cred-id',
        credentialPublicKey: Buffer.from([1, 2, 3]),
        counter: 5n,
        transports: ['internal'],
        user: {
          id: 42n,
          phoneNumber: '+1234567890',
          username: 'test-user',
        },
      };
      prisma.credential.findUnique.mockResolvedValue(storedCred);

      // Store an auth challenge
      mockGenerateAuthOpts.mockResolvedValue({
        challenge: 'auth-challenge',
      });
      await service.generateAuthenticationOptions();

      mockVerifyAuthResp.mockResolvedValue({
        verified: true,
        authenticationInfo: { newCounter: 6 },
      });
      prisma.credential.update.mockResolvedValue({});

      const result = await service.verifyAuthentication(
        mockAuthCredential as any,
      );

      expect(result.verified).toBe(true);
      expect(result.user).toEqual(storedCred.user);
      expect(prisma.credential.update).toHaveBeenCalledWith({
        where: { id: 1n },
        data: { counter: 6n },
      });
    });

    it('should throw when verification fails', async () => {
      const storedCred = {
        id: 1n,
        credentialId: 'stored-cred-id',
        credentialPublicKey: Buffer.from([1, 2, 3]),
        counter: 0n,
        transports: [],
        user: { id: 1n, phoneNumber: '+1' },
      };
      prisma.credential.findUnique.mockResolvedValue(storedCred);

      // Store a challenge
      mockGenerateAuthOpts.mockResolvedValue({ challenge: 'c' });
      await service.generateAuthenticationOptions();

      mockVerifyAuthResp.mockRejectedValue(new Error('Bad signature'));

      await expect(
        service.verifyAuthentication(mockAuthCredential as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw when verified is false', async () => {
      const storedCred = {
        id: 1n,
        credentialId: 'stored-cred-id',
        credentialPublicKey: Buffer.from([1, 2, 3]),
        counter: 0n,
        transports: [],
        user: { id: 1n, phoneNumber: '+1' },
      };
      prisma.credential.findUnique.mockResolvedValue(storedCred);

      mockGenerateAuthOpts.mockResolvedValue({ challenge: 'c2' });
      await service.generateAuthenticationOptions();

      mockVerifyAuthResp.mockResolvedValue({
        verified: false,
        authenticationInfo: { newCounter: 0 },
      });

      await expect(
        service.verifyAuthentication(mockAuthCredential as any),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
