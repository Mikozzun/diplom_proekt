import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { TelegramAuthService } from '../../../src/auth/telegram-auth.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { createHash, createHmac } from 'node:crypto';

/**
 * Helper to create a valid Telegram Login Widget hash.
 */
function createTelegramHash(
  data: Record<string, unknown>,
  botToken: string,
): string {
  const checkString = Object.keys(data)
    .sort()
    .map((key) => `${key}=${data[key]}`)
    .join('\n');

  const secretKey = createHash('sha256').update(botToken).digest();
  return createHmac('sha256', secretKey).update(checkString).digest('hex');
}

describe('TelegramAuthService', () => {
  let service: TelegramAuthService;
  let prisma: {
    user: {
      findUnique: jest.Mock;
      create: jest.Mock;
    };
  };

  const BOT_TOKEN = 'test-bot-token-123456:ABCdefGHI';

  beforeEach(async () => {
    process.env.TELEGRAM_BOT_TOKEN = BOT_TOKEN;

    prisma = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TelegramAuthService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<TelegramAuthService>(TelegramAuthService);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('verifyAuth', () => {
    it('should return true for valid auth data', () => {
      const authDate = Math.floor(Date.now() / 1000);
      const data = {
        id: 123456789,
        first_name: 'John',
        auth_date: authDate,
      };
      const hash = createTelegramHash(data, BOT_TOKEN);

      const result = service.verifyAuth({ ...data, hash });

      expect(result).toBe(true);
    });

    it('should return false for tampered data', () => {
      const authDate = Math.floor(Date.now() / 1000);
      const data = {
        id: 123456789,
        first_name: 'John',
        auth_date: authDate,
      };
      const hash = createTelegramHash(data, BOT_TOKEN);

      const result = service.verifyAuth({
        ...data,
        first_name: 'Hacker',
        hash,
      });

      expect(result).toBe(false);
    });

    it('should return false for wrong bot token hash', () => {
      const authDate = Math.floor(Date.now() / 1000);
      const data = {
        id: 123456789,
        auth_date: authDate,
      };
      const hash = createTelegramHash(data, 'wrong-token');

      const result = service.verifyAuth({ ...data, hash });

      expect(result).toBe(false);
    });
  });

  describe('authenticate', () => {
    it('should create new user for valid Telegram login', async () => {
      const authDate = Math.floor(Date.now() / 1000);
      const data = {
        id: 987654321,
        username: 'teleuser',
        auth_date: authDate,
      };
      const hash = createTelegramHash(data, BOT_TOKEN);

      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({
        id: 10n,
        email: null,
        username: 'teleuser',
        telegramId: '987654321',
      });

      const result = await service.authenticate({ ...data, hash });

      expect(result).toEqual({
        userId: '10',
        email: null,
        username: 'teleuser',
      });
    });

    it('should return existing user if telegramId already linked', async () => {
      const authDate = Math.floor(Date.now() / 1000);
      const data = {
        id: 987654321,
        username: 'teleuser',
        auth_date: authDate,
      };
      const hash = createTelegramHash(data, BOT_TOKEN);

      prisma.user.findUnique.mockResolvedValue({
        id: 20n,
        email: 'tele@example.com',
        username: 'existinguser',
        telegramId: '987654321',
      });

      const result = await service.authenticate({ ...data, hash });

      expect(result).toEqual({
        userId: '20',
        email: 'tele@example.com',
        username: 'existinguser',
      });
      expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException for invalid hash', async () => {
      const data = {
        id: 123,
        auth_date: Math.floor(Date.now() / 1000),
        hash: 'invalid-hash',
      };

      await expect(service.authenticate(data)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException for expired auth data', async () => {
      const expiredDate = Math.floor(Date.now() / 1000) - 600; // 10 min ago
      const data = {
        id: 123,
        auth_date: expiredDate,
      };
      const hash = createTelegramHash(data, BOT_TOKEN);

      await expect(service.authenticate({ ...data, hash })).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should use first_name + last_name when username is absent', async () => {
      const authDate = Math.floor(Date.now() / 1000);
      const data = {
        id: 555,
        first_name: 'Alice',
        last_name: 'Smith',
        auth_date: authDate,
      };
      const hash = createTelegramHash(data, BOT_TOKEN);

      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({
        id: 30n,
        email: null,
        username: 'Alice Smith',
        telegramId: '555',
      });

      await service.authenticate({ ...data, hash });

      expect(prisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          username: 'Alice Smith',
        }),
      });
    });
  });
});
