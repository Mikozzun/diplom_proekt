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

describe('Storage Routes', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('POST /api/storage', () => {
    it('creates a storage entry', async () => {
      prismaMock.storage.create.mockResolvedValue({
        id: 1n,
        fileName: 'test.jpg',
        fileType: 'image/jpeg',
        fileSize: 1024n,
        fileUrl: 'https://example.com/test.jpg',
        userId: 1n,
        createdAt: new Date(),
      });

      const res = await request(app)
        .post('/api/storage')
        .set(mockAuthHeader)
        .send({
          fileName: 'test.jpg',
          fileType: 'image/jpeg',
          fileSize: '1024',
          fileUrl: 'https://example.com/test.jpg',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.fileName).toBe('test.jpg');
    });
  });

  describe('GET /api/storage', () => {
    it('returns user files', async () => {
      prismaMock.storage.findMany.mockResolvedValue([
        {
          id: 1n,
          fileName: 'test.jpg',
          fileType: 'image/jpeg',
          fileSize: 1024n,
          fileUrl: 'https://example.com/test.jpg',
          userId: 1n,
          createdAt: new Date(),
        },
      ]);

      const res = await request(app).get('/api/storage').set(mockAuthHeader);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
    });
  });

  describe('DELETE /api/storage/:id', () => {
    it('deletes own file', async () => {
      prismaMock.storage.findUnique.mockResolvedValue({
        id: 1n,
        userId: 1n,
      });
      prismaMock.storage.delete.mockResolvedValue({});

      const res = await request(app)
        .delete('/api/storage/1')
        .set(mockAuthHeader);

      expect(res.status).toBe(204);
    });

    it('returns 403 for other user file', async () => {
      prismaMock.storage.findUnique.mockResolvedValue({
        id: 1n,
        userId: 2n,
      });

      const res = await request(app)
        .delete('/api/storage/1')
        .set(mockAuthHeader);

      expect(res.status).toBe(403);
    });
  });
});
