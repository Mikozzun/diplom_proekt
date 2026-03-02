import { Test, TestingModule } from '@nestjs/testing';
import { LikesController } from '../../../src/likes/likes.controller';
import { LikesService } from '../../../src/likes/likes.service';
import type { Request } from 'express';

describe('LikesController', () => {
  let controller: LikesController;
  let likesService: {
    toggle: jest.Mock;
    unlike: jest.Mock;
    findByPost: jest.Mock;
  };

  const mockRequest = (userId?: string): Request =>
    ({
      session: { userId },
      sessionID: 'sid',
      headers: { 'user-agent': 'TestAgent' },
      ip: '127.0.0.1',
    }) as unknown as Request;

  beforeEach(async () => {
    likesService = {
      toggle: jest.fn(),
      unlike: jest.fn(),
      findByPost: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [LikesController],
      providers: [{ provide: LikesService, useValue: likesService }],
    }).compile();

    controller = module.get<LikesController>(LikesController);
  });

  describe('POST /posts/:postId/likes', () => {
    it('should toggle like', async () => {
      likesService.toggle.mockResolvedValue({ liked: true });
      const req = mockRequest('5');

      const result = await controller.toggle('1', req);

      expect(result).toEqual({ liked: true });
      expect(likesService.toggle).toHaveBeenCalledWith('1', '5');
    });
  });

  describe('DELETE /posts/:postId/likes', () => {
    it('should unlike', async () => {
      likesService.unlike.mockResolvedValue({ message: 'Like removed' });
      const req = mockRequest('5');

      const result = await controller.unlike('1', req);

      expect(result).toEqual({ message: 'Like removed' });
      expect(likesService.unlike).toHaveBeenCalledWith('1', '5');
    });
  });

  describe('GET /posts/:postId/likes', () => {
    it('should list likes for a post', async () => {
      const expected = { data: [], hasMore: false, nextCursor: null };
      likesService.findByPost.mockResolvedValue(expected);

      const result = await controller.findByPost('1');

      expect(result).toEqual(expected);
      expect(likesService.findByPost).toHaveBeenCalledWith('1', {
        cursor: undefined,
        limit: undefined,
      });
    });

    it('should pass cursor and limit', async () => {
      likesService.findByPost.mockResolvedValue({
        data: [],
        hasMore: false,
        nextCursor: null,
      });

      await controller.findByPost('1', '10', '5');

      expect(likesService.findByPost).toHaveBeenCalledWith('1', {
        cursor: '10',
        limit: 5,
      });
    });
  });
});
