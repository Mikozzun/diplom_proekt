import './helpers/prisma.mock';
import './helpers/auth.mock';
import request from 'supertest';
import app from '../app';
import { prismaMock } from './helpers/prisma.mock';
import bcrypt from 'bcryptjs';

jest.mock('bcryptjs');
jest.mock('@clerk/express', () => ({
  clerkMiddleware: () => (_req: any, _res: any, next: any) => next(),
  getAuth: () => null,
}));

const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('Auth Routes', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('POST /api/auth/register', () => {
    it('creates a new user', async () => {
      prismaMock.user.findFirst.mockResolvedValue(null);
      prismaMock.user.create.mockResolvedValue({
        id: 1n,
        username: 'testuser',
        phoneNumber: '1234567890',
        createdAt: new Date(),
      });
      prismaMock.userSettings.create.mockResolvedValue({});
      prismaMock.userActivityLog.create.mockResolvedValue({});
      (mockBcrypt.hash as jest.Mock).mockResolvedValue('hashed');

      const res = await request(app).post('/api/auth/register').send({
        username: 'testuser',
        phoneNumber: '1234567890',
        passkey: 'secret123',
      });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.username).toBe('testuser');
    });

    it('returns 409 for duplicate user', async () => {
      prismaMock.user.findFirst.mockResolvedValue({ id: 1n });

      const res = await request(app).post('/api/auth/register').send({
        username: 'testuser',
        phoneNumber: '1234567890',
        passkey: 'secret123',
      });

      expect(res.status).toBe(409);
    });

    it('validates required fields', async () => {
      const res = await request(app).post('/api/auth/register').send({});
      expect(res.status).toBe(422);
    });
  });

  describe('POST /api/auth/login', () => {
    it('authenticates user with valid credentials', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: 1n,
        username: 'testuser',
        passkey: 'hashed',
        profileImage: null,
      });
      (mockBcrypt.compare as jest.Mock).mockResolvedValue(true);
      (mockBcrypt.hash as jest.Mock).mockResolvedValue('hashed-refresh');
      prismaMock.session.create.mockResolvedValue({ id: 1n });
      prismaMock.userActivityLog.create.mockResolvedValue({});

      const res = await request(app).post('/api/auth/login').send({
        username: 'testuser',
        passkey: 'secret123',
      });

      expect(res.status).toBe(200);
      expect(res.body.data.accessToken).toBeDefined();
    });

    it('returns 401 for invalid credentials', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      const res = await request(app).post('/api/auth/login').send({
        username: 'testuser',
        passkey: 'wrong',
      });

      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('returns 401 without token', async () => {
      const res = await request(app).post('/api/auth/refresh');
      expect(res.status).toBe(401);
    });
  });
});
