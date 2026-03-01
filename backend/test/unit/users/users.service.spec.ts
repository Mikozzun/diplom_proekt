import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { UsersService } from '../../../src/users/users.service';
import { PrismaService } from '../../../prisma/prisma.service';

describe('UsersService', () => {
  let service: UsersService;
  let prisma: {
    user: {
      findUnique: jest.Mock;
      update: jest.Mock;
    };
    userSettings: {
      findUnique: jest.Mock;
      create: jest.Mock;
      upsert: jest.Mock;
    };
  };

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      userSettings: {
        findUnique: jest.fn(),
        create: jest.fn(),
        upsert: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [UsersService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  // ─── getProfile ───────────────────────────────

  describe('getProfile', () => {
    it('should return the user profile', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 1n,
        phoneNumber: '+1234567890',
        username: 'alice',
        profileImage: 'avatar.png',
        createdAt: new Date('2025-01-01'),
      });

      const result = await service.getProfile('1');

      expect(result).toEqual({
        id: '1',
        phoneNumber: '+1234567890',
        username: 'alice',
        profileImage: 'avatar.png',
        createdAt: new Date('2025-01-01'),
      });
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 1n },
        select: {
          id: true,
          phoneNumber: true,
          username: true,
          profileImage: true,
          createdAt: true,
        },
      });
    });

    it('should throw NotFoundException when user does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.getProfile('999')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ─── getPublicProfile ─────────────────────────

  describe('getPublicProfile', () => {
    it('should return public profile with post count', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 2n,
        username: 'bob',
        profileImage: null,
        createdAt: new Date('2025-06-01'),
        _count: { posts: 5 },
      });

      const result = await service.getPublicProfile('2');

      expect(result).toEqual({
        id: '2',
        username: 'bob',
        profileImage: null,
        createdAt: new Date('2025-06-01'),
        postCount: 5,
      });
    });

    it('should throw NotFoundException when user does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.getPublicProfile('999')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ─── updateProfile ────────────────────────────

  describe('updateProfile', () => {
    it('should update username', async () => {
      prisma.user.update.mockResolvedValue({
        id: 1n,
        phoneNumber: '+1234567890',
        username: 'new-name',
        profileImage: null,
        createdAt: new Date('2025-01-01'),
      });

      const result = await service.updateProfile('1', {
        username: 'new-name',
      });

      expect(result.username).toBe('new-name');
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 1n },
        data: { username: 'new-name' },
        select: expect.any(Object),
      });
    });

    it('should update profile image', async () => {
      prisma.user.update.mockResolvedValue({
        id: 1n,
        phoneNumber: '+1234567890',
        username: 'alice',
        profileImage: 'new-avatar.jpg',
        createdAt: new Date('2025-01-01'),
      });

      const result = await service.updateProfile('1', {
        profileImage: 'new-avatar.jpg',
      });

      expect(result.profileImage).toBe('new-avatar.jpg');
    });

    it('should return current profile when no fields provided', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 1n,
        phoneNumber: '+1234567890',
        username: 'alice',
        profileImage: null,
        createdAt: new Date('2025-01-01'),
      });

      const result = await service.updateProfile('1', {});

      expect(result.username).toBe('alice');
      expect(prisma.user.update).not.toHaveBeenCalled();
    });
  });

  // ─── getSettings ──────────────────────────────

  describe('getSettings', () => {
    it('should return existing settings', async () => {
      prisma.userSettings.findUnique.mockResolvedValue({
        id: 10n,
        theme: 'dark',
        notificationsEnabled: false,
        createdAt: new Date('2025-01-01'),
      });

      const result = await service.getSettings('1');

      expect(result).toEqual({
        id: '10',
        theme: 'dark',
        notificationsEnabled: false,
        createdAt: new Date('2025-01-01'),
      });
    });

    it('should create default settings when none exist', async () => {
      prisma.userSettings.findUnique.mockResolvedValue(null);
      prisma.userSettings.create.mockResolvedValue({
        id: 11n,
        theme: 'light',
        notificationsEnabled: true,
        createdAt: new Date('2025-06-01'),
      });

      const result = await service.getSettings('1');

      expect(result.theme).toBe('light');
      expect(result.notificationsEnabled).toBe(true);
      expect(prisma.userSettings.create).toHaveBeenCalledWith({
        data: { userId: 1n },
      });
    });
  });

  // ─── updateSettings ───────────────────────────

  describe('updateSettings', () => {
    it('should update theme', async () => {
      prisma.userSettings.upsert.mockResolvedValue({
        id: 10n,
        theme: 'dark',
        notificationsEnabled: true,
        createdAt: new Date('2025-01-01'),
      });

      const result = await service.updateSettings('1', { theme: 'dark' });

      expect(result.theme).toBe('dark');
      expect(prisma.userSettings.upsert).toHaveBeenCalled();
    });

    it('should update notifications preference', async () => {
      prisma.userSettings.upsert.mockResolvedValue({
        id: 10n,
        theme: 'light',
        notificationsEnabled: false,
        createdAt: new Date('2025-01-01'),
      });

      const result = await service.updateSettings('1', {
        notificationsEnabled: false,
      });

      expect(result.notificationsEnabled).toBe(false);
    });
  });
});
