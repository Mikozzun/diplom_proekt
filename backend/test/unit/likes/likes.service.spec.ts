import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { LikesService } from '../../../src/likes/likes.service';
import { PrismaService } from '../../../prisma/prisma.service';

describe('LikesService', () => {
  let service: LikesService;
  let prisma: {
    post: { findUnique: jest.Mock };
    like: {
      findFirst: jest.Mock;
      findMany: jest.Mock;
      create: jest.Mock;
      delete: jest.Mock;
    };
  };

  beforeEach(async () => {
    prisma = {
      post: { findUnique: jest.fn() },
      like: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [LikesService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<LikesService>(LikesService);
  });

  // ─── toggle ───────────────────────────────────

  describe('toggle', () => {
    it('should like a post when not already liked', async () => {
      prisma.post.findUnique.mockResolvedValue({ id: 1n });
      prisma.like.findFirst.mockResolvedValue(null);
      prisma.like.create.mockResolvedValue({ id: 10n });

      const result = await service.toggle('1', '5');

      expect(result).toEqual({ liked: true });
      expect(prisma.like.create).toHaveBeenCalledWith({
        data: { userId: 5n, postId: 1n },
      });
    });

    it('should unlike a post when already liked', async () => {
      prisma.post.findUnique.mockResolvedValue({ id: 1n });
      prisma.like.findFirst.mockResolvedValue({
        id: 10n,
        userId: 5n,
        postId: 1n,
      });
      prisma.like.delete.mockResolvedValue({ id: 10n });

      const result = await service.toggle('1', '5');

      expect(result).toEqual({ liked: false });
      expect(prisma.like.delete).toHaveBeenCalledWith({ where: { id: 10n } });
    });

    it('should throw NotFoundException when post does not exist', async () => {
      prisma.post.findUnique.mockResolvedValue(null);

      await expect(service.toggle('999', '5')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ─── unlike ───────────────────────────────────

  describe('unlike', () => {
    it('should remove an existing like', async () => {
      prisma.like.findFirst.mockResolvedValue({ id: 10n });
      prisma.like.delete.mockResolvedValue({ id: 10n });

      const result = await service.unlike('1', '5');

      expect(result).toEqual({ message: 'Like removed' });
    });

    it('should throw NotFoundException when like does not exist', async () => {
      prisma.like.findFirst.mockResolvedValue(null);

      await expect(service.unlike('1', '5')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── findByPost ───────────────────────────────

  describe('findByPost', () => {
    it('should return paginated likes with user info', async () => {
      prisma.post.findUnique.mockResolvedValue({ id: 1n });
      prisma.like.findMany.mockResolvedValue([
        {
          id: 10n,
          userId: 5n,
          postId: 1n,
          createdAt: new Date('2025-01-01'),
          user: { id: 5n, username: 'alice', profileImage: null },
        },
      ]);

      const result = await service.findByPost('1');

      expect(result.data).toHaveLength(1);
      expect(result.data[0].user).toEqual({
        id: '5',
        username: 'alice',
        profileImage: null,
      });
      expect(result.hasMore).toBe(false);
    });

    it('should detect hasMore when extra row returned', async () => {
      prisma.post.findUnique.mockResolvedValue({ id: 1n });
      const likes = Array.from({ length: 3 }, (_, i) => ({
        id: BigInt(i + 1),
        userId: BigInt(i + 10),
        postId: 1n,
        createdAt: new Date(),
        user: { id: BigInt(i + 10), username: `user${i}`, profileImage: null },
      }));
      prisma.like.findMany.mockResolvedValue(likes);

      const result = await service.findByPost('1', { limit: 2 });

      expect(result.data).toHaveLength(2);
      expect(result.hasMore).toBe(true);
    });

    it('should throw NotFoundException when post does not exist', async () => {
      prisma.post.findUnique.mockResolvedValue(null);

      await expect(service.findByPost('999')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
