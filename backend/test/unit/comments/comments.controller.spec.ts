import { Test, TestingModule } from '@nestjs/testing';
import { CommentsController } from '../../../src/comments/comments.controller';
import { CommentsService } from '../../../src/comments/comments.service';
import type { Request } from 'express';

describe('CommentsController', () => {
  let controller: CommentsController;
  let commentsService: {
    create: jest.Mock;
    findByPost: jest.Mock;
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
    commentsService = {
      create: jest.fn(),
      findByPost: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CommentsController],
      providers: [{ provide: CommentsService, useValue: commentsService }],
    }).compile();

    controller = module.get<CommentsController>(CommentsController);
  });

  describe('POST /posts/:postId/comments', () => {
    it('should create a comment', async () => {
      const dto = { content: 'Great post!' };
      const expected = { id: '1', content: 'Great post!', postId: '100' };
      commentsService.create.mockResolvedValue(expected);
      const req = mockRequest('1');

      const result = await controller.create('100', req, dto);

      expect(result).toEqual(expected);
      expect(commentsService.create).toHaveBeenCalledWith('100', '1', dto);
    });
  });

  describe('GET /posts/:postId/comments', () => {
    it('should list comments for a post', async () => {
      const expected = { data: [], hasMore: false, nextCursor: null };
      commentsService.findByPost.mockResolvedValue(expected);

      const result = await controller.findByPost('100');

      expect(result).toEqual(expected);
      expect(commentsService.findByPost).toHaveBeenCalledWith('100', {
        cursor: undefined,
        limit: undefined,
      });
    });

    it('should pass cursor and limit', async () => {
      commentsService.findByPost.mockResolvedValue({
        data: [],
        hasMore: false,
        nextCursor: null,
      });

      await controller.findByPost('100', '5', '10');

      expect(commentsService.findByPost).toHaveBeenCalledWith('100', {
        cursor: '5',
        limit: 10,
      });
    });
  });

  describe('PATCH /comments/:id', () => {
    it('should update own comment', async () => {
      const dto = { content: 'Edited' };
      const expected = { id: '50', content: 'Edited' };
      commentsService.update.mockResolvedValue(expected);
      const req = mockRequest('1');

      const result = await controller.update('50', req, dto);

      expect(result).toEqual(expected);
      expect(commentsService.update).toHaveBeenCalledWith('50', '1', dto);
    });
  });

  describe('DELETE /comments/:id', () => {
    it('should delete own comment', async () => {
      commentsService.remove.mockResolvedValue({ message: 'Comment deleted' });
      const req = mockRequest('1');

      const result = await controller.remove('50', req);

      expect(result).toEqual({ message: 'Comment deleted' });
      expect(commentsService.remove).toHaveBeenCalledWith('50', '1');
    });
  });
});
