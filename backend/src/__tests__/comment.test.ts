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

describe('Comment Routes', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('POST /api/posts/:postId/comments', () => {
    it('creates a comment', async () => {
      prismaMock.post.findUnique.mockResolvedValue({
        id: 1n,
        userId: 2n,
      });
      prismaMock.comment.create.mockResolvedValue({
        id: 1n,
        content: 'Nice post!',
        userId: 1n,
        postId: 1n,
        createdAt: new Date(),
        user: { id: 1n, username: 'testuser', profileImage: null },
      });
      prismaMock.notification.create.mockResolvedValue({});

      const res = await request(app)
        .post('/api/posts/1/comments')
        .set(mockAuthHeader)
        .send({ content: 'Nice post!' });

      expect(res.status).toBe(201);
      expect(res.body.data.content).toBe('Nice post!');
    });

    it('returns 404 for non-existent post', async () => {
      prismaMock.post.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .post('/api/posts/999/comments')
        .set(mockAuthHeader)
        .send({ content: 'Test' });

      expect(res.status).toBe(404);
    });

    it('validates content', async () => {
      const res = await request(app)
        .post('/api/posts/1/comments')
        .set(mockAuthHeader)
        .send({});

      expect(res.status).toBe(422);
    });
  });

  describe('GET /api/posts/:postId/comments', () => {
    it('returns paginated comments', async () => {
      prismaMock.comment.findMany.mockResolvedValue([
        {
          id: 1n,
          content: 'Test',
          user: { id: 1n, username: 'testuser', profileImage: null },
        },
      ]);
      prismaMock.comment.count.mockResolvedValue(1);

      const res = await request(app).get('/api/posts/1/comments');

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
    });
  });

  describe('PUT /api/comments/:id', () => {
    it('updates own comment', async () => {
      prismaMock.comment.findUnique.mockResolvedValue({
        id: 1n,
        userId: 1n,
      });
      prismaMock.comment.update.mockResolvedValue({
        id: 1n,
        content: 'Updated',
        user: { id: 1n, username: 'testuser', profileImage: null },
      });

      const res = await request(app)
        .put('/api/comments/1')
        .set(mockAuthHeader)
        .send({ content: 'Updated' });

      expect(res.status).toBe(200);
    });

    it('returns 403 for non-author', async () => {
      prismaMock.comment.findUnique.mockResolvedValue({
        id: 1n,
        userId: 2n,
      });

      const res = await request(app)
        .put('/api/comments/1')
        .set(mockAuthHeader)
        .send({ content: 'Updated' });

      expect(res.status).toBe(403);
    });
  });

  describe('DELETE /api/comments/:id', () => {
    it('deletes own comment', async () => {
      prismaMock.comment.findUnique.mockResolvedValue({
        id: 1n,
        userId: 1n,
      });
      prismaMock.comment.delete.mockResolvedValue({});

      const res = await request(app)
        .delete('/api/comments/1')
        .set(mockAuthHeader);

      expect(res.status).toBe(204);
    });
  });
});
