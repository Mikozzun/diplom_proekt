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

const mockPost = {
  id: 1n,
  content: 'Test post',
  imageUrl: null,
  videoUrl: null,
  userId: 1n,
  createdAt: new Date(),
  updatedAt: null,
  user: { id: 1n, username: 'testuser', profileImage: null },
  _count: { comments: 0, likes: 0, reactions: 0 },
};

describe('Post Routes', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('GET /api/posts', () => {
    it('returns paginated posts', async () => {
      prismaMock.post.findMany.mockResolvedValue([mockPost]);
      prismaMock.post.count.mockResolvedValue(1);

      const res = await request(app).get('/api/posts');

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.meta.total).toBe(1);
    });
  });

  describe('POST /api/posts', () => {
    it('creates a new post', async () => {
      prismaMock.post.create.mockResolvedValue(mockPost);
      prismaMock.userActivityLog.create.mockResolvedValue({});

      const res = await request(app)
        .post('/api/posts')
        .set(mockAuthHeader)
        .send({ content: 'Test post' });

      expect(res.status).toBe(201);
      expect(res.body.data.content).toBe('Test post');
    });

    it('requires authentication', async () => {
      const res = await request(app)
        .post('/api/posts')
        .send({ content: 'Test' });
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/posts/:id', () => {
    it('returns a single post', async () => {
      prismaMock.post.findUnique.mockResolvedValue(mockPost);

      const res = await request(app).get('/api/posts/1');

      expect(res.status).toBe(200);
      expect(res.body.data.content).toBe('Test post');
    });

    it('returns 404 for unknown post', async () => {
      prismaMock.post.findUnique.mockResolvedValue(null);

      const res = await request(app).get('/api/posts/999');
      expect(res.status).toBe(404);
    });
  });

  describe('PUT /api/posts/:id', () => {
    it('updates a post', async () => {
      prismaMock.post.findUnique.mockResolvedValue({ ...mockPost, userId: 1n });
      prismaMock.post.update.mockResolvedValue({
        ...mockPost,
        content: 'Updated',
      });

      const res = await request(app)
        .put('/api/posts/1')
        .set(mockAuthHeader)
        .send({ content: 'Updated' });

      expect(res.status).toBe(200);
    });

    it('returns 403 for non-author', async () => {
      prismaMock.post.findUnique.mockResolvedValue({
        ...mockPost,
        userId: 2n,
      });

      const res = await request(app)
        .put('/api/posts/1')
        .set(mockAuthHeader)
        .send({ content: 'Updated' });

      expect(res.status).toBe(403);
    });
  });

  describe('DELETE /api/posts/:id', () => {
    it('deletes own post', async () => {
      prismaMock.post.findUnique.mockResolvedValue({ ...mockPost, userId: 1n });
      prismaMock.post.delete.mockResolvedValue(mockPost);

      const res = await request(app).delete('/api/posts/1').set(mockAuthHeader);

      expect(res.status).toBe(204);
    });
  });

  describe('POST /api/posts/:postId/like', () => {
    it('toggles like on a post', async () => {
      prismaMock.like.findUnique.mockResolvedValue(null);
      prismaMock.like.create.mockResolvedValue({ id: 1n });
      prismaMock.post.findUnique.mockResolvedValue({ userId: 2n });
      prismaMock.notification.create.mockResolvedValue({});

      const res = await request(app)
        .post('/api/posts/1/like')
        .set(mockAuthHeader);

      expect(res.status).toBe(200);
      expect(res.body.data.liked).toBe(true);
    });
  });

  describe('POST /api/posts/:postId/bookmark', () => {
    it('toggles bookmark', async () => {
      prismaMock.bookmark.findUnique.mockResolvedValue(null);
      prismaMock.bookmark.create.mockResolvedValue({ id: 1n });

      const res = await request(app)
        .post('/api/posts/1/bookmark')
        .set(mockAuthHeader);

      expect(res.status).toBe(200);
      expect(res.body.data.bookmarked).toBe(true);
    });
  });

  describe('POST /api/posts/:postId/react', () => {
    it('adds reaction to post', async () => {
      prismaMock.reaction.upsert.mockResolvedValue({
        id: 1n,
        reactionType: 'like',
      });

      const res = await request(app)
        .post('/api/posts/1/react')
        .set(mockAuthHeader)
        .send({ reactionType: 'like' });

      expect(res.status).toBe(200);
    });
  });

  describe('GET /api/posts/:postId/reactions', () => {
    it('returns reaction counts', async () => {
      prismaMock.reaction.groupBy.mockResolvedValue([
        { reactionType: 'like', _count: { reactionType: 5 } },
      ]);

      const res = await request(app).get('/api/posts/1/reactions');

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
    });
  });
});
