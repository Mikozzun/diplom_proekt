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

describe('Admin Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    prismaMock.admin.findUnique.mockResolvedValue({ id: 1n, userId: 1n });
  });

  describe('GET /api/admin/dashboard', () => {
    it('returns dashboard stats', async () => {
      prismaMock.user.count.mockResolvedValue(100);
      prismaMock.post.count.mockResolvedValue(50);
      prismaMock.comment.count.mockResolvedValue(200);
      prismaMock.moderationQueue.count.mockResolvedValue(5);

      const res = await request(app)
        .get('/api/admin/dashboard')
        .set(mockAuthHeader);

      expect(res.status).toBe(200);
      expect(res.body.data.totalUsers).toBe(100);
      expect(res.body.data.pendingModeration).toBe(5);
    });

    it('returns 401 without auth', async () => {
      const res = await request(app).get('/api/admin/dashboard');
      expect(res.status).toBe(401);
    });

    it('returns 403 for non-admin', async () => {
      prismaMock.admin.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .get('/api/admin/dashboard')
        .set(mockAuthHeader);

      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/admin/users', () => {
    it('returns paginated users list', async () => {
      prismaMock.user.findMany.mockResolvedValue([
        { id: 1n, username: 'user1' },
      ]);
      prismaMock.user.count.mockResolvedValue(1);

      const res = await request(app)
        .get('/api/admin/users')
        .set(mockAuthHeader);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
    });
  });

  describe('POST /api/admin/users/:userId/role', () => {
    it('assigns role to user', async () => {
      prismaMock.role.findUnique.mockResolvedValue({
        id: 1n,
        name: 'moderator',
      });
      prismaMock.userRole.upsert.mockResolvedValue({ id: 1n });

      const res = await request(app)
        .post('/api/admin/users/2/role')
        .set(mockAuthHeader)
        .send({ role: 'moderator' });

      expect(res.status).toBe(200);
    });
  });

  describe('POST /api/admin/users/:userId/ban', () => {
    it('bans a user', async () => {
      prismaMock.session.deleteMany.mockResolvedValue({ count: 1 });
      prismaMock.userActivityLog.create.mockResolvedValue({});

      const res = await request(app)
        .post('/api/admin/users/2/ban')
        .set(mockAuthHeader);

      expect(res.status).toBe(204);
    });
  });

  describe('GET /api/admin/moderation', () => {
    it('returns moderation queue', async () => {
      prismaMock.moderationQueue.findMany.mockResolvedValue([
        { id: 1n, contentType: 'post', contentId: 1n, status: 'pending' },
      ]);
      prismaMock.moderationQueue.count.mockResolvedValue(1);

      const res = await request(app)
        .get('/api/admin/moderation')
        .set(mockAuthHeader);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
    });
  });

  describe('PUT /api/admin/moderation/:id', () => {
    it('approves moderation item', async () => {
      prismaMock.moderationQueue.findUnique.mockResolvedValue({
        id: 1n,
        contentType: 'post',
        contentId: 1n,
      });
      prismaMock.moderationQueue.update.mockResolvedValue({
        id: 1n,
        status: 'approved',
      });

      const res = await request(app)
        .put('/api/admin/moderation/1')
        .set(mockAuthHeader)
        .send({ action: 'approve' });

      expect(res.status).toBe(200);
    });

    it('validates action', async () => {
      const res = await request(app)
        .put('/api/admin/moderation/1')
        .set(mockAuthHeader)
        .send({ action: 'invalid' });

      expect(res.status).toBe(422);
    });
  });
});
