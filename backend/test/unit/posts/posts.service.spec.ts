import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PostsService } from '../../../src/posts/posts.service';
import { PrismaService } from '../../../prisma/prisma.service';

describe('PostsService', () => {
  let service: PostsService;
  let prisma: {
    post: {
      create: jest.Mock;
      findMany: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
  };

  const fakePost = (overrides: Record<string, unknown> = {}) => ({
    id: 100n,
    userId: 1n,
    content: 'Hello world',
    imageUrl: null,
    videoUrl: null,
    createdAt: new Date('2025-01-01'),
    updatedAt: null,
    user: { id: 1n, username: 'alice', profileImage: null },
    _count: { comments: 0, likes: 0 },
    ...overrides,
  });

  beforeEach(async () => {
    prisma = {
      post: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [PostsService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<PostsService>(PostsService);
  });

  // ─── create ───────────────────────────────────

  describe('create', () => {
    it('should create a post with content', async () => {
      const post = fakePost();
      prisma.post.create.mockResolvedValue(post);

      const result = await service.create('1', { content: 'Hello world' });

      expect(result.id).toBe('100');
      expect(result.content).toBe('Hello world');
      expect(result.author).toEqual({
        id: '1',
        username: 'alice',
        profileImage: null,
      });
      expect(prisma.post.create).toHaveBeenCalled();
    });

    it('should create a post with image only', async () => {
      const post = fakePost({ content: null, imageUrl: 'img.jpg' });
      prisma.post.create.mockResolvedValue(post);

      const result = await service.create('1', { imageUrl: 'img.jpg' });

      expect(result.imageUrl).toBe('img.jpg');
    });

    it('should throw BadRequestException when post has no content/media', async () => {
      await expect(service.create('1', {})).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  // ─── findAll ──────────────────────────────────

  describe('findAll', () => {
    it('should return paginated posts', async () => {
      const posts = [fakePost({ id: 2n }), fakePost({ id: 1n })];
      prisma.post.findMany.mockResolvedValue(posts);

      const result = await service.findAll({ limit: 20 });

      expect(result.data).toHaveLength(2);
      expect(result.hasMore).toBe(false);
      expect(result.nextCursor).toBe('1');
    });

    it('should detect hasMore when extra row returned', async () => {
      // Request 2, get 3 back → hasMore = true
      const posts = [
        fakePost({ id: 3n }),
        fakePost({ id: 2n }),
        fakePost({ id: 1n }),
      ];
      prisma.post.findMany.mockResolvedValue(posts);

      const result = await service.findAll({ limit: 2 });

      expect(result.data).toHaveLength(2);
      expect(result.hasMore).toBe(true);
      expect(result.nextCursor).toBe('2');
    });

    it('should use cursor when provided', async () => {
      prisma.post.findMany.mockResolvedValue([]);

      await service.findAll({ cursor: '50', limit: 10 });

      expect(prisma.post.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          cursor: { id: 50n },
          skip: 1,
        }),
      );
    });

    it('should cap limit at MAX_PAGE_SIZE', async () => {
      prisma.post.findMany.mockResolvedValue([]);

      await service.findAll({ limit: 500 });

      expect(prisma.post.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 101, // min(500, 100) + 1
        }),
      );
    });
  });

  // ─── findByUser ───────────────────────────────

  describe('findByUser', () => {
    it('should return posts by a specific user', async () => {
      const posts = [fakePost({ id: 5n, userId: 2n })];
      prisma.post.findMany.mockResolvedValue(posts);

      const result = await service.findByUser('2');

      expect(result.data).toHaveLength(1);
      expect(prisma.post.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 2n },
        }),
      );
    });
  });

  // ─── findOne ──────────────────────────────────

  describe('findOne', () => {
    it('should return a single post', async () => {
      prisma.post.findUnique.mockResolvedValue(fakePost());

      const result = await service.findOne('100');

      expect(result.id).toBe('100');
      expect(result.commentCount).toBe(0);
      expect(result.likeCount).toBe(0);
    });

    it('should throw NotFoundException when post does not exist', async () => {
      prisma.post.findUnique.mockResolvedValue(null);

      await expect(service.findOne('999')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── update ───────────────────────────────────

  describe('update', () => {
    it('should update own post', async () => {
      prisma.post.findUnique.mockResolvedValue(fakePost());
      prisma.post.update.mockResolvedValue(
        fakePost({ content: 'Updated content' }),
      );

      const result = await service.update('100', '1', {
        content: 'Updated content',
      });

      expect(result.content).toBe('Updated content');
    });

    it('should throw NotFoundException when post does not exist', async () => {
      prisma.post.findUnique.mockResolvedValue(null);

      await expect(
        service.update('999', '1', { content: 'Update' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when not the owner', async () => {
      prisma.post.findUnique.mockResolvedValue(fakePost({ userId: 2n }));

      await expect(
        service.update('100', '1', { content: 'Not mine' }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // ─── remove ───────────────────────────────────

  describe('remove', () => {
    it('should delete own post', async () => {
      prisma.post.findUnique.mockResolvedValue(fakePost());
      prisma.post.delete.mockResolvedValue(fakePost());

      const result = await service.remove('100', '1');

      expect(result).toEqual({ message: 'Post deleted' });
      expect(prisma.post.delete).toHaveBeenCalledWith({
        where: { id: 100n },
      });
    });

    it('should throw NotFoundException when post does not exist', async () => {
      prisma.post.findUnique.mockResolvedValue(null);

      await expect(service.remove('999', '1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException when not the owner', async () => {
      prisma.post.findUnique.mockResolvedValue(fakePost({ userId: 2n }));

      await expect(service.remove('100', '1')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
