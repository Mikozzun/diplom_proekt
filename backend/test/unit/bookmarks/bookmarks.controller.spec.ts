import { Test, TestingModule } from '@nestjs/testing';
import { BookmarksController } from '../../../src/bookmarks/bookmarks.controller';
import { BookmarksService } from '../../../src/bookmarks/bookmarks.service';
import type { Request } from 'express';

describe('BookmarksController', () => {
  let controller: BookmarksController;
  let bookmarksService: {
    toggle: jest.Mock;
    remove: jest.Mock;
    findByUser: jest.Mock;
  };

  const mockRequest = (userId?: string): Request =>
    ({
      session: { userId },
      sessionID: 'sid',
      headers: { 'user-agent': 'TestAgent' },
      ip: '127.0.0.1',
    }) as unknown as Request;

  beforeEach(async () => {
    bookmarksService = {
      toggle: jest.fn(),
      remove: jest.fn(),
      findByUser: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [BookmarksController],
      providers: [{ provide: BookmarksService, useValue: bookmarksService }],
    }).compile();

    controller = module.get<BookmarksController>(BookmarksController);
  });

  describe('POST /posts/:postId/bookmark', () => {
    it('should toggle bookmark', async () => {
      bookmarksService.toggle.mockResolvedValue({ bookmarked: true });
      const req = mockRequest('5');

      const result = await controller.toggle('1', req);

      expect(result).toEqual({ bookmarked: true });
      expect(bookmarksService.toggle).toHaveBeenCalledWith('1', '5');
    });
  });

  describe('DELETE /posts/:postId/bookmark', () => {
    it('should remove bookmark', async () => {
      bookmarksService.remove.mockResolvedValue({
        message: 'Bookmark removed',
      });
      const req = mockRequest('5');

      const result = await controller.remove('1', req);

      expect(result).toEqual({ message: 'Bookmark removed' });
      expect(bookmarksService.remove).toHaveBeenCalledWith('1', '5');
    });
  });

  describe('GET /bookmarks', () => {
    it('should list user bookmarks', async () => {
      const expected = { data: [], hasMore: false, nextCursor: null };
      bookmarksService.findByUser.mockResolvedValue(expected);
      const req = mockRequest('5');

      const result = await controller.findMyBookmarks(req);

      expect(result).toEqual(expected);
      expect(bookmarksService.findByUser).toHaveBeenCalledWith('5', {
        cursor: undefined,
        limit: undefined,
      });
    });

    it('should pass cursor and limit', async () => {
      bookmarksService.findByUser.mockResolvedValue({
        data: [],
        hasMore: false,
        nextCursor: null,
      });
      const req = mockRequest('5');

      await controller.findMyBookmarks(req, '10', '5');

      expect(bookmarksService.findByUser).toHaveBeenCalledWith('5', {
        cursor: '10',
        limit: 5,
      });
    });
  });
});
