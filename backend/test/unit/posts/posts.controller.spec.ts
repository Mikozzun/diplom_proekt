import { Test, TestingModule } from '@nestjs/testing';
import { PostsController } from '../../../src/posts/posts.controller';
import { PostsService } from '../../../src/posts/posts.service';
import type { Request } from 'express';

describe('PostsController', () => {
  let controller: PostsController;
  let postsService: {
    create: jest.Mock;
    findAll: jest.Mock;
    findByUser: jest.Mock;
    findOne: jest.Mock;
    update: jest.Mock;
    remove: jest.Mock;
  };

  const mockRequest = (userId?: string): Request =>
    ({
      session: { userId },
      sessionID: 'sid',
      headers: { 'user-agent': 'TestAgent' },
      ip: '127.0.0.1',
    }) as unknown as Request;

  beforeEach(async () => {
    postsService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findByUser: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PostsController],
      providers: [{ provide: PostsService, useValue: postsService }],
    }).compile();

    controller = module.get<PostsController>(PostsController);
  });

  describe('POST /posts', () => {
    it('should create a post', async () => {
      const dto = { content: 'Hello' };
      const expected = { id: '1', content: 'Hello' };
      postsService.create.mockResolvedValue(expected);
      const req = mockRequest('1');

      const result = await controller.create(req, dto);

      expect(result).toEqual(expected);
      expect(postsService.create).toHaveBeenCalledWith('1', dto);
    });
  });

  describe('GET /posts', () => {
    it('should list posts without cursor', async () => {
      const expected = { data: [], hasMore: false, nextCursor: null };
      postsService.findAll.mockResolvedValue(expected);

      const result = await controller.findAll();

      expect(result).toEqual(expected);
      expect(postsService.findAll).toHaveBeenCalledWith({
        cursor: undefined,
        limit: undefined,
      });
    });

    it('should pass cursor and limit', async () => {
      postsService.findAll.mockResolvedValue({
        data: [],
        hasMore: false,
        nextCursor: null,
      });

      await controller.findAll('50', '10');

      expect(postsService.findAll).toHaveBeenCalledWith({
        cursor: '50',
        limit: 10,
      });
    });
  });

  describe('GET /posts/user/:userId', () => {
    it('should list posts by user', async () => {
      const expected = { data: [], hasMore: false, nextCursor: null };
      postsService.findByUser.mockResolvedValue(expected);

      const result = await controller.findByUser('2');

      expect(result).toEqual(expected);
      expect(postsService.findByUser).toHaveBeenCalledWith('2', {
        cursor: undefined,
        limit: undefined,
      });
    });
  });

  describe('GET /posts/:id', () => {
    it('should return a single post', async () => {
      const expected = { id: '100', content: 'Test' };
      postsService.findOne.mockResolvedValue(expected);

      const result = await controller.findOne('100');

      expect(result).toEqual(expected);
      expect(postsService.findOne).toHaveBeenCalledWith('100');
    });
  });

  describe('PATCH /posts/:id', () => {
    it('should update own post', async () => {
      const dto = { content: 'Updated' };
      const expected = { id: '100', content: 'Updated' };
      postsService.update.mockResolvedValue(expected);
      const req = mockRequest('1');

      const result = await controller.update('100', req, dto);

      expect(result).toEqual(expected);
      expect(postsService.update).toHaveBeenCalledWith('100', '1', dto);
    });
  });

  describe('DELETE /posts/:id', () => {
    it('should delete own post', async () => {
      postsService.remove.mockResolvedValue({ message: 'Post deleted' });
      const req = mockRequest('1');

      const result = await controller.remove('100', req);

      expect(result).toEqual({ message: 'Post deleted' });
      expect(postsService.remove).toHaveBeenCalledWith('100', '1');
    });
  });
});
