import './helpers/prisma.mock';
import './helpers/auth.mock';
import request from 'supertest';
import app from '../app';
import { prismaMock } from './helpers/prisma.mock';
import { mockAuthHeader } from './helpers/auth.mock';

jest.mock('@clerk/express', () => ({
  clerkMiddleware: () => (_req: any, _res: any, next: any) => next(),
  getAuth: () => null,
}));

describe('Bookmark Routes', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('GET /api/bookmarks', () => {
    it('returns user bookmarks', async () => {
      prismaMock.bookmark.findMany.mockResolvedValue([
        {
          id: 1n,
          userId: 1n,
          postId: 1n,
          createdAt: new Date(),
          post: {
            id: 1n,
            content: 'Bookmarked post',
            user: { id: 2n, username: 'author', profileImage: null },
            _count: { comments: 0, likes: 1, reactions: 0 },
          },
        },
      ]);

      const res = await request(app).get('/api/bookmarks').set(mockAuthHeader);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
    });

    it('requires authentication', async () => {
      const res = await request(app).get('/api/bookmarks');
      expect(res.status).toBe(401);
    });
  });
});
