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

describe('Report Routes', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('POST /api/reports', () => {
    it('creates a report', async () => {
      prismaMock.report.create.mockResolvedValue({
        id: 1n,
        reportType: 'spam',
        description: 'This is spam',
        userId: 1n,
        createdAt: new Date(),
      });

      const res = await request(app)
        .post('/api/reports')
        .set(mockAuthHeader)
        .send({ reportType: 'spam', description: 'This is spam' });

      expect(res.status).toBe(201);
      expect(res.body.data.reportType).toBe('spam');
    });

    it('requires authentication', async () => {
      const res = await request(app)
        .post('/api/reports')
        .send({ reportType: 'spam' });
      expect(res.status).toBe(401);
    });

    it('validates reportType', async () => {
      const res = await request(app)
        .post('/api/reports')
        .set(mockAuthHeader)
        .send({});
      expect(res.status).toBe(422);
    });
  });
});
