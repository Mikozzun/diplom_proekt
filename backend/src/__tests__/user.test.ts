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

describe('User Routes', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('GET /api/users/me', () => {
    it('returns current user', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: 1n,
        username: 'testuser',
        phoneNumber: '1234567890',
        profileImage: null,
        createdAt: new Date(),
      });
      prismaMock.admin.findUnique.mockResolvedValue(null);

      const res = await request(app).get('/api/users/me').set(mockAuthHeader);

      expect(res.status).toBe(200);
      expect(res.body.data.username).toBe('testuser');
    });

    it('returns 401 without auth', async () => {
      const res = await request(app).get('/api/users/me');
      expect(res.status).toBe(401);
    });
  });

  describe('PUT /api/users/me', () => {
    it('updates user profile', async () => {
      prismaMock.user.update.mockResolvedValue({
        id: 1n,
        username: 'updated',
        phoneNumber: '1234567890',
        profileImage: null,
        createdAt: new Date(),
      });

      const res = await request(app)
        .put('/api/users/me')
        .set(mockAuthHeader)
        .send({ username: 'updated' });

      expect(res.status).toBe(200);
      expect(res.body.data.username).toBe('updated');
    });
  });

  describe('GET /api/users/:id', () => {
    it('returns user profile', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: 1n,
        username: 'testuser',
        profileImage: null,
        createdAt: new Date(),
        _count: { posts: 5, comments: 10, likes: 20 },
      });

      const res = await request(app).get('/api/users/1');

      expect(res.status).toBe(200);
      expect(res.body.data.username).toBe('testuser');
    });

    it('returns 404 for unknown user', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      const res = await request(app).get('/api/users/999');
      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/users/me/sessions', () => {
    it('returns active sessions', async () => {
      prismaMock.session.findMany.mockResolvedValue([
        {
          id: 1n,
          deviceInfo: 'Chrome',
          ipAddress: '127.0.0.1',
          lastActive: new Date(),
          createdAt: new Date(),
        },
      ]);

      const res = await request(app)
        .get('/api/users/me/sessions')
        .set(mockAuthHeader);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
    });
  });

  describe('GET /api/users/me/settings', () => {
    it('returns user settings', async () => {
      prismaMock.userSettings.findUnique.mockResolvedValue({
        id: 1n,
        userId: 1n,
        theme: 'dark',
        notificationsEnabled: true,
      });

      const res = await request(app)
        .get('/api/users/me/settings')
        .set(mockAuthHeader);

      expect(res.status).toBe(200);
      expect(res.body.data.theme).toBe('dark');
    });
  });
});
