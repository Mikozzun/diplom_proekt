import { Test, TestingModule } from '@nestjs/testing';
import { ReactionsController } from '../../../src/reactions/reactions.controller';
import { ReactionsService } from '../../../src/reactions/reactions.service';
import type { Request } from 'express';

describe('ReactionsController', () => {
  let controller: ReactionsController;
  let reactionsService: {
    toggle: jest.Mock;
    remove: jest.Mock;
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
    reactionsService = {
      toggle: jest.fn(),
      remove: jest.fn(),
      findByPost: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReactionsController],
      providers: [{ provide: ReactionsService, useValue: reactionsService }],
    }).compile();

    controller = module.get<ReactionsController>(ReactionsController);
  });

  describe('POST /posts/:postId/reactions', () => {
    it('should toggle a reaction', async () => {
      reactionsService.toggle.mockResolvedValue({
        reacted: true,
        reactionType: '👍',
      });
      const req = mockRequest('5');

      const result = await controller.toggle('1', req, { reactionType: '👍' });

      expect(result).toEqual({ reacted: true, reactionType: '👍' });
      expect(reactionsService.toggle).toHaveBeenCalledWith('1', '5', {
        reactionType: '👍',
      });
    });
  });

  describe('DELETE /posts/:postId/reactions', () => {
    it('should remove a reaction', async () => {
      reactionsService.remove.mockResolvedValue({
        message: 'Reaction removed',
      });
      const req = mockRequest('5');

      const result = await controller.remove('1', req, '❤️');

      expect(result).toEqual({ message: 'Reaction removed' });
      expect(reactionsService.remove).toHaveBeenCalledWith('1', '5', '❤️');
    });
  });

  describe('GET /posts/:postId/reactions', () => {
    it('should return grouped reactions', async () => {
      const expected = {
        postId: '1',
        reactions: [{ reactionType: '👍', count: 5 }],
      };
      reactionsService.findByPost.mockResolvedValue(expected);

      const result = await controller.findByPost('1');

      expect(result).toEqual(expected);
      expect(reactionsService.findByPost).toHaveBeenCalledWith('1');
    });
  });
});
