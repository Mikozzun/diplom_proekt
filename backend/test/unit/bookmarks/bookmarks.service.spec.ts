import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { BookmarksService } from '../../../src/bookmarks/bookmarks.service';
import { PrismaService } from '../../../prisma/prisma.service';

describe('BookmarksService', () => {
  let service: BookmarksService;
  let prisma: {
    post: { findUnique: jest.Mock };
    bookmark: {
      findFirst: jest.Mock;
      findMany: jest.Mock;
      create: jest.Mock;
      delete: jest.Mock;
    };
  };

  beforeEach(async () => {
    prisma = {
      post: { findUnique: jest.fn() },
      bookmark: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookmarksService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<BookmarksService>(BookmarksService);
  });

  // ─── toggle ───────────────────────────────────

  describe('toggle', () => {
    it('should bookmark a post when not already bookmarked', async () => {
      prisma.post.findUnique.mockResolvedValue({ id: 1n });
      prisma.bookmark.findFirst.mockResolvedValue(null);
      prisma.bookmark.create.mockResolvedValue({ id: 20n });

      const result = await service.toggle('1', '5');

      expect(result).toEqual({ bookmarked: true });
      expect(prisma.bookmark.create).toHaveBeenCalledWith({
        data: { userId: 5n, postId: 1n },
      });
    });

    it('should remove bookmark when already bookmarked', async () => {
      prisma.post.findUnique.mockResolvedValue({ id: 1n });
      prisma.bookmark.findFirst.mockResolvedValue({ id: 20n });
      prisma.bookmark.delete.mockResolvedValue({ id: 20n });

      const result = await service.toggle('1', '5');

      expect(result).toEqual({ bookmarked: false });
      expect(prisma.bookmark.delete).toHaveBeenCalledWith({
        where: { id: 20n },
      });
    });

    it('should throw NotFoundException when post does not exist', async () => {
      prisma.post.findUnique.mockResolvedValue(null);

      await expect(service.toggle('999', '5')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ─── remove ───────────────────────────────────

  describe('remove', () => {
    it('should remove an existing bookmark', async () => {
      prisma.bookmark.findFirst.mockResolvedValue({ id: 20n });
      prisma.bookmark.delete.mockResolvedValue({ id: 20n });

      const result = await service.remove('1', '5');

      expect(result).toEqual({ message: 'Bookmark removed' });
    });

    it('should throw NotFoundException when bookmark does not exist', async () => {
      prisma.bookmark.findFirst.mockResolvedValue(null);

      await expect(service.remove('1', '5')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── findByUser ───────────────────────────────

  describe('findByUser', () => {
    it('should return paginated bookmarks with post details', async () => {
      prisma.bookmark.findMany.mockResolvedValue([
        {
          id: 20n,
          createdAt: new Date('2025-01-01'),
          post: {
            id: 1n,
            userId: 2n,
            content: 'Hello',
            imageUrl: null,
            videoUrl: null,
            createdAt: new Date('2025-01-01'),
            user: { id: 2n, username: 'bob', profileImage: null },
            _count: { comments: 3, likes: 10 },
          },
        },
      ]);

      const result = await service.findByUser('5');

      expect(result.data).toHaveLength(1);
      expect(result.data[0].post).toBeDefined();
      expect(result.data[0].post!.author!.username).toBe('bob');
      expect(result.data[0].post!.commentCount).toBe(3);
      expect(result.data[0].post!.likeCount).toBe(10);
      expect(result.hasMore).toBe(false);
    });

    it('should detect hasMore when extra row returned', async () => {
      const bookmarks = Array.from({ length: 3 }, (_, i) => ({
        id: BigInt(i + 1),
        createdAt: new Date(),
        post: {
          id: BigInt(i + 100),
          userId: 2n,
          content: `Post ${i}`,
          imageUrl: null,
          videoUrl: null,
          createdAt: new Date(),
          user: { id: 2n, username: 'bob', profileImage: null },
          _count: { comments: 0, likes: 0 },
        },
      }));
      prisma.bookmark.findMany.mockResolvedValue(bookmarks);

      const result = await service.findByUser('5', { limit: 2 });

      expect(result.data).toHaveLength(2);
      expect(result.hasMore).toBe(true);
    });

    it('should return empty data when no bookmarks', async () => {
      prisma.bookmark.findMany.mockResolvedValue([]);

      const result = await service.findByUser('5');

      expect(result.data).toHaveLength(0);
      expect(result.hasMore).toBe(false);
      expect(result.nextCursor).toBeNull();
    });
  });
});
