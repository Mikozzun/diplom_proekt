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

describe('Poll Routes', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('POST /api/posts/:postId/poll', () => {
    it('creates a poll', async () => {
      prismaMock.poll.create.mockResolvedValue({
        id: 1n,
        question: 'Favorite color?',
        options: ['Red', 'Blue', 'Green'],
        postId: 1n,
        createdAt: new Date(),
      });

      const res = await request(app)
        .post('/api/posts/1/poll')
        .set(mockAuthHeader)
        .send({
          question: 'Favorite color?',
          options: ['Red', 'Blue', 'Green'],
        });

      expect(res.status).toBe(201);
      expect(res.body.data.question).toBe('Favorite color?');
    });

    it('validates minimum options', async () => {
      const res = await request(app)
        .post('/api/posts/1/poll')
        .set(mockAuthHeader)
        .send({ question: 'Test?', options: ['One'] });

      expect(res.status).toBe(422);
    });
  });

  describe('POST /api/polls/:pollId/respond', () => {
    it('records poll response', async () => {
      prismaMock.poll.findUnique.mockResolvedValue({
        id: 1n,
        options: ['Red', 'Blue'],
      });
      prismaMock.pollResponse.upsert.mockResolvedValue({
        id: 1n,
        selectedOption: 'Red',
      });

      const res = await request(app)
        .post('/api/polls/1/respond')
        .set(mockAuthHeader)
        .send({ selectedOption: 'Red' });

      expect(res.status).toBe(200);
    });
  });

  describe('GET /api/polls/:pollId/results', () => {
    it('returns poll results', async () => {
      prismaMock.poll.findUnique.mockResolvedValue({
        id: 1n,
        question: 'Test?',
        options: ['A', 'B'],
      });
      prismaMock.pollResponse.groupBy.mockResolvedValue([
        { selectedOption: 'A', _count: { selectedOption: 3 } },
        { selectedOption: 'B', _count: { selectedOption: 2 } },
      ]);

      const res = await request(app).get('/api/polls/1/results');

      expect(res.status).toBe(200);
      expect(res.body.data.totalVotes).toBe(5);
    });

    it('returns 404 for unknown poll', async () => {
      prismaMock.poll.findUnique.mockResolvedValue(null);

      const res = await request(app).get('/api/polls/999/results');
      expect(res.status).toBe(404);
    });
  });
});
