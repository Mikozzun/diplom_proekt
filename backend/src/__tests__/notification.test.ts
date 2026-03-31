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

describe('Notification Routes', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('GET /api/notifications', () => {
    it('returns user notifications', async () => {
      prismaMock.notification.findMany.mockResolvedValue([
        {
          id: 1n,
          type: 'like',
          message: 'Someone liked your post',
          readAt: null,
          createdAt: new Date(),
        },
      ]);
      prismaMock.notification.count.mockResolvedValue(1);

      const res = await request(app)
        .get('/api/notifications')
        .set(mockAuthHeader);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
    });
  });

  describe('GET /api/notifications/unread', () => {
    it('returns unread count', async () => {
      prismaMock.notification.count.mockResolvedValue(5);

      const res = await request(app)
        .get('/api/notifications/unread')
        .set(mockAuthHeader);

      expect(res.status).toBe(200);
      expect(res.body.data.count).toBe(5);
    });
  });

  describe('PUT /api/notifications/read-all', () => {
    it('marks all as read', async () => {
      prismaMock.notification.updateMany.mockResolvedValue({ count: 5 });

      const res = await request(app)
        .put('/api/notifications/read-all')
        .set(mockAuthHeader);

      expect(res.status).toBe(204);
    });
  });

  describe('PUT /api/notifications/:id/read', () => {
    it('marks one as read', async () => {
      prismaMock.notification.updateMany.mockResolvedValue({ count: 1 });

      const res = await request(app)
        .put('/api/notifications/1/read')
        .set(mockAuthHeader);

      expect(res.status).toBe(204);
    });
  });
});
