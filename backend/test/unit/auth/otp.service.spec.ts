import { Test, TestingModule } from '@nestjs/testing';
import { OtpService } from '../../../src/auth/otp.service';
import { PrismaService } from '../../../prisma/prisma.service';

describe('OtpService', () => {
  let service: OtpService;
  let prisma: {
    otpChallenge: {
      create: jest.Mock;
      findFirst: jest.Mock;
      update: jest.Mock;
    };
  };

  beforeEach(async () => {
    prisma = {
      otpChallenge: {
        create: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [OtpService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<OtpService>(OtpService);
  });

  describe('sendOtp', () => {
    it('should create an OTP challenge and return success message', async () => {
      prisma.otpChallenge.create.mockResolvedValue({
        id: 1n,
        phoneNumber: '+1234567890',
        code: '123456',
        expiresAt: new Date(),
        verified: false,
        createdAt: new Date(),
      });

      const result = await service.sendOtp('+1234567890');

      expect(result).toEqual({ message: 'OTP sent successfully' });
      expect(prisma.otpChallenge.create).toHaveBeenCalledTimes(1);
      expect(prisma.otpChallenge.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          phoneNumber: '+1234567890',
          code: expect.any(String),
          expiresAt: expect.any(Date),
        }),
      });
    });

    it('should generate a 6-digit code', async () => {
      prisma.otpChallenge.create.mockResolvedValue({});

      await service.sendOtp('+1234567890');

      const callArgs = prisma.otpChallenge.create.mock.calls[0][0] as {
        data: { code: string };
      };
      const code = callArgs.data.code;
      expect(code).toMatch(/^\d{6}$/);
    });

    it('should set expiry in the future (approximately 5 minutes)', async () => {
      prisma.otpChallenge.create.mockResolvedValue({});
      const now = Date.now();

      await service.sendOtp('+1234567890');

      const callArgs = prisma.otpChallenge.create.mock.calls[0][0] as {
        data: { expiresAt: Date };
      };
      const expiresAt = callArgs.data.expiresAt.getTime();
      // Should expire approximately 5 minutes in the future (± 2 seconds tolerance)
      expect(expiresAt).toBeGreaterThanOrEqual(now + 5 * 60 * 1000 - 2000);
      expect(expiresAt).toBeLessThanOrEqual(now + 5 * 60 * 1000 + 2000);
    });
  });

  describe('verifyOtp', () => {
    it('should return true and mark challenge verified when code is valid', async () => {
      const challenge = {
        id: 1n,
        phoneNumber: '+1234567890',
        code: '123456',
        verified: false,
        expiresAt: new Date(Date.now() + 300_000),
        createdAt: new Date(),
      };

      prisma.otpChallenge.findFirst.mockResolvedValue(challenge);
      prisma.otpChallenge.update.mockResolvedValue({
        ...challenge,
        verified: true,
      });

      const result = await service.verifyOtp('+1234567890', '123456');

      expect(result).toBe(true);
      expect(prisma.otpChallenge.update).toHaveBeenCalledWith({
        where: { id: 1n },
        data: { verified: true },
      });
    });

    it('should return false when no matching challenge exists', async () => {
      prisma.otpChallenge.findFirst.mockResolvedValue(null);

      const result = await service.verifyOtp('+1234567890', '000000');

      expect(result).toBe(false);
      expect(prisma.otpChallenge.update).not.toHaveBeenCalled();
    });

    it('should return false for expired OTP (no match returned)', async () => {
      // Prisma query filters by expiresAt >= now, so null means expired/invalid
      prisma.otpChallenge.findFirst.mockResolvedValue(null);

      const result = await service.verifyOtp('+1234567890', '123456');

      expect(result).toBe(false);
    });

    it('should return false for already verified OTP', async () => {
      // verified: false is in the query filter, so already-verified won't be returned
      prisma.otpChallenge.findFirst.mockResolvedValue(null);

      const result = await service.verifyOtp('+1234567890', '123456');

      expect(result).toBe(false);
    });

    it('should query with correct filters', async () => {
      prisma.otpChallenge.findFirst.mockResolvedValue(null);

      await service.verifyOtp('+9876543210', '654321');

      expect(prisma.otpChallenge.findFirst).toHaveBeenCalledWith({
        where: {
          phoneNumber: '+9876543210',
          code: '654321',
          verified: false,
          expiresAt: { gte: expect.any(Date) },
        },
        orderBy: { createdAt: 'desc' },
      });
    });
  });
});
