import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { EmailAuthService } from '../../../src/auth/email-auth.service';
import { PrismaService } from '../../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('EmailAuthService', () => {
  let service: EmailAuthService;
  let prisma: {
    user: {
      findUnique: jest.Mock;
      create: jest.Mock;
    };
  };

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailAuthService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<EmailAuthService>(EmailAuthService);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('register', () => {
    it('should create a new user with hashed password', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      prisma.user.create.mockResolvedValue({
        id: 1n,
        email: 'test@example.com',
        username: 'testuser',
        passwordHash: 'hashed-password',
      });

      const result = await service.register(
        'test@example.com',
        'password123',
        'testuser',
      );

      expect(result).toEqual({
        userId: '1',
        email: 'test@example.com',
        username: 'testuser',
      });
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          email: 'test@example.com',
          passwordHash: 'hashed-password',
          username: 'testuser',
        },
      });
    });

    it('should throw ConflictException when email already exists', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 1n,
        email: 'existing@example.com',
      });

      await expect(
        service.register('existing@example.com', 'pass123', 'user'),
      ).rejects.toThrow(ConflictException);

      expect(prisma.user.create).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('should return user info for valid credentials', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 42n,
        email: 'test@example.com',
        username: 'testuser',
        passwordHash: 'hashed-password',
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login('test@example.com', 'password123');

      expect(result).toEqual({
        userId: '42',
        email: 'test@example.com',
        username: 'testuser',
      });
    });

    it('should throw UnauthorizedException when user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.login('nobody@example.com', 'pass')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException when user has no password hash', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 1n,
        email: 'github-user@example.com',
        passwordHash: null,
      });

      await expect(
        service.login('github-user@example.com', 'pass'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for wrong password', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 1n,
        email: 'test@example.com',
        passwordHash: 'hashed',
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.login('test@example.com', 'wrong-password'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
