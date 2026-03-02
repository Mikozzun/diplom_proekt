import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { ReactionsService } from '../../../src/reactions/reactions.service';
import { PrismaService } from '../../../prisma/prisma.service';

describe('ReactionsService', () => {
  let service: ReactionsService;
  let prisma: {
    post: { findUnique: jest.Mock };
    reaction: {
      findFirst: jest.Mock;
      create: jest.Mock;
      delete: jest.Mock;
      groupBy: jest.Mock;
    };
  };

  beforeEach(async () => {
    prisma = {
      post: { findUnique: jest.fn() },
      reaction: {
        findFirst: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
        groupBy: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReactionsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<ReactionsService>(ReactionsService);
  });

  // ─── toggle ───────────────────────────────────

  describe('toggle', () => {
    it('should add a reaction when not yet reacted', async () => {
      prisma.post.findUnique.mockResolvedValue({ id: 1n });
      prisma.reaction.findFirst.mockResolvedValue(null);
      prisma.reaction.create.mockResolvedValue({ id: 30n });

      const result = await service.toggle('1', '5', { reactionType: '👍' });

      expect(result).toEqual({ reacted: true, reactionType: '👍' });
      expect(prisma.reaction.create).toHaveBeenCalledWith({
        data: { userId: 5n, postId: 1n, reactionType: '👍' },
      });
    });

    it('should remove a reaction when already reacted with same type', async () => {
      prisma.post.findUnique.mockResolvedValue({ id: 1n });
      prisma.reaction.findFirst.mockResolvedValue({ id: 30n });
      prisma.reaction.delete.mockResolvedValue({ id: 30n });

      const result = await service.toggle('1', '5', { reactionType: '👍' });

      expect(result).toEqual({ reacted: false, reactionType: '👍' });
    });

    it('should throw NotFoundException when post does not exist', async () => {
      prisma.post.findUnique.mockResolvedValue(null);

      await expect(
        service.toggle('999', '5', { reactionType: '👍' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException for empty reaction type', async () => {
      await expect(
        service.toggle('1', '5', { reactionType: '' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for invalid reaction type', async () => {
      await expect(
        service.toggle('1', '5', { reactionType: '🦊' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ─── remove ───────────────────────────────────

  describe('remove', () => {
    it('should remove an existing reaction', async () => {
      prisma.reaction.findFirst.mockResolvedValue({ id: 30n });
      prisma.reaction.delete.mockResolvedValue({ id: 30n });

      const result = await service.remove('1', '5', '❤️');

      expect(result).toEqual({ message: 'Reaction removed' });
    });

    it('should throw NotFoundException when reaction does not exist', async () => {
      prisma.reaction.findFirst.mockResolvedValue(null);

      await expect(service.remove('1', '5', '❤️')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ─── findByPost ───────────────────────────────

  describe('findByPost', () => {
    it('should return reactions grouped by type', async () => {
      prisma.post.findUnique.mockResolvedValue({ id: 1n });
      prisma.reaction.groupBy.mockResolvedValue([
        { reactionType: '👍', _count: { id: 5 } },
        { reactionType: '❤️', _count: { id: 3 } },
      ]);

      const result = await service.findByPost('1');

      expect(result.postId).toBe('1');
      expect(result.reactions).toEqual([
        { reactionType: '👍', count: 5 },
        { reactionType: '❤️', count: 3 },
      ]);
    });

    it('should return empty reactions for a post with none', async () => {
      prisma.post.findUnique.mockResolvedValue({ id: 1n });
      prisma.reaction.groupBy.mockResolvedValue([]);

      const result = await service.findByPost('1');

      expect(result.reactions).toEqual([]);
    });

    it('should throw NotFoundException when post does not exist', async () => {
      prisma.post.findUnique.mockResolvedValue(null);

      await expect(service.findByPost('999')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
