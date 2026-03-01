import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { CommentsService } from '../../../src/comments/comments.service';
import { PrismaService } from '../../../prisma/prisma.service';

describe('CommentsService', () => {
  let service: CommentsService;
  let prisma: {
    post: { findUnique: jest.Mock };
    comment: {
      create: jest.Mock;
      findMany: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
  };

  const fakeComment = (overrides: Record<string, unknown> = {}) => ({
    id: 50n,
    postId: 100n,
    userId: 1n,
    content: 'Nice post!',
    createdAt: new Date('2025-01-01'),
    updatedAt: null,
    user: { id: 1n, username: 'alice', profileImage: null },
    ...overrides,
  });

  beforeEach(async () => {
    prisma = {
      post: { findUnique: jest.fn() },
      comment: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommentsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<CommentsService>(CommentsService);
  });

  // ─── create ───────────────────────────────────

  describe('create', () => {
    it('should create a comment', async () => {
      prisma.post.findUnique.mockResolvedValue({ id: 100n });
      prisma.comment.create.mockResolvedValue(fakeComment());

      const result = await service.create('100', '1', {
        content: 'Nice post!',
      });

      expect(result.id).toBe('50');
      expect(result.content).toBe('Nice post!');
      expect(result.author).toEqual({
        id: '1',
        username: 'alice',
        profileImage: null,
      });
    });

    it('should throw BadRequestException for empty content', async () => {
      await expect(
        service.create('100', '1', { content: '  ' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when post does not exist', async () => {
      prisma.post.findUnique.mockResolvedValue(null);

      await expect(
        service.create('999', '1', { content: 'Hello' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ─── findByPost ───────────────────────────────

  describe('findByPost', () => {
    it('should return paginated comments', async () => {
      prisma.post.findUnique.mockResolvedValue({ id: 100n });
      prisma.comment.findMany.mockResolvedValue([
        fakeComment({ id: 1n }),
        fakeComment({ id: 2n }),
      ]);

      const result = await service.findByPost('100');

      expect(result.data).toHaveLength(2);
      expect(result.hasMore).toBe(false);
      expect(result.nextCursor).toBe('2');
    });

    it('should detect hasMore when extra row returned', async () => {
      prisma.post.findUnique.mockResolvedValue({ id: 100n });
      const comments = [
        fakeComment({ id: 1n }),
        fakeComment({ id: 2n }),
        fakeComment({ id: 3n }),
      ];
      prisma.comment.findMany.mockResolvedValue(comments);

      const result = await service.findByPost('100', { limit: 2 });

      expect(result.data).toHaveLength(2);
      expect(result.hasMore).toBe(true);
      expect(result.nextCursor).toBe('2');
    });

    it('should throw NotFoundException when post does not exist', async () => {
      prisma.post.findUnique.mockResolvedValue(null);

      await expect(service.findByPost('999')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should use cursor when provided', async () => {
      prisma.post.findUnique.mockResolvedValue({ id: 100n });
      prisma.comment.findMany.mockResolvedValue([]);

      await service.findByPost('100', { cursor: '10', limit: 5 });

      expect(prisma.comment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          cursor: { id: 10n },
          skip: 1,
        }),
      );
    });
  });

  // ─── update ───────────────────────────────────

  describe('update', () => {
    it('should update own comment', async () => {
      prisma.comment.findUnique.mockResolvedValue(fakeComment());
      prisma.comment.update.mockResolvedValue(
        fakeComment({ content: 'Edited comment' }),
      );

      const result = await service.update('50', '1', {
        content: 'Edited comment',
      });

      expect(result.content).toBe('Edited comment');
    });

    it('should throw BadRequestException for empty content', async () => {
      await expect(service.update('50', '1', { content: '' })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException when comment does not exist', async () => {
      prisma.comment.findUnique.mockResolvedValue(null);

      await expect(
        service.update('999', '1', { content: 'Edit' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when not the owner', async () => {
      prisma.comment.findUnique.mockResolvedValue(fakeComment({ userId: 2n }));

      await expect(
        service.update('50', '1', { content: 'Not mine' }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // ─── remove ───────────────────────────────────

  describe('remove', () => {
    it('should delete own comment', async () => {
      prisma.comment.findUnique.mockResolvedValue(fakeComment());
      prisma.comment.delete.mockResolvedValue(fakeComment());

      const result = await service.remove('50', '1');

      expect(result).toEqual({ message: 'Comment deleted' });
      expect(prisma.comment.delete).toHaveBeenCalledWith({
        where: { id: 50n },
      });
    });

    it('should throw NotFoundException when comment does not exist', async () => {
      prisma.comment.findUnique.mockResolvedValue(null);

      await expect(service.remove('999', '1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException when not the owner', async () => {
      prisma.comment.findUnique.mockResolvedValue(fakeComment({ userId: 2n }));

      await expect(service.remove('50', '1')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
