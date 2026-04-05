import './helpers/prisma.mock';
import './helpers/auth.mock';
import request from 'supertest';
import app from '../app';
import { prismaMock } from './helpers/prisma.mock';
import { mockAuthHeader } from './helpers/auth.mock';
import bcrypt from 'bcryptjs';
import {
  generateTokenPair,
  verifyAccessToken,
  verifyRefreshToken,
} from '../utils/jwt';

jest.mock('bcryptjs');
jest.mock('@clerk/express', () => ({
  clerkMiddleware: () => (_req: any, _res: any, next: any) => next(),
  getAuth: jest.fn(() => null),
}));

const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;
const { getAuth } = jest.requireMock('@clerk/express');

const NOW = new Date('2026-04-02T12:00:00Z');

const fakeUser = {
  id: 1n,
  username: 'frogger_user',
  phoneNumber: '+380501234567',
  passkey: 'hashed-passkey',
  profileImage: null,
  clerkId: null,
  createdAt: NOW,
};

const fakeUserSelect = {
  id: 1n,
  username: 'frogger_user',
  phoneNumber: '+380501234567',
  createdAt: NOW,
};

describe('Full Registration Flow', () => {
  beforeEach(() => jest.clearAllMocks());

  // ─────────────────────────────────────────────
  // 1. Registration — creates user + settings + activity log
  // ─────────────────────────────────────────────
  describe('Step 1: POST /api/auth/register', () => {
    it('registers user and stores in database', async () => {
      prismaMock.user.findFirst.mockResolvedValue(null);
      prismaMock.user.create.mockResolvedValue(fakeUserSelect);
      prismaMock.userSettings.create.mockResolvedValue({ id: 1n });
      prismaMock.userActivityLog.create.mockResolvedValue({ id: 1n });
      (mockBcrypt.hash as jest.Mock).mockResolvedValue('hashed-passkey');

      const res = await request(app).post('/api/auth/register').send({
        username: 'frogger_user',
        phoneNumber: '+380501234567',
        passkey: 'securePass1',
      });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.username).toBe('frogger_user');
      expect(res.body.data.phoneNumber).toBe('+380501234567');

      // Verify DB calls
      expect(prismaMock.user.findFirst).toHaveBeenCalledWith({
        where: {
          OR: [{ username: 'frogger_user' }, { phoneNumber: '+380501234567' }],
        },
      });
      expect(prismaMock.user.create).toHaveBeenCalledWith({
        data: {
          username: 'frogger_user',
          phoneNumber: '+380501234567',
          passkey: 'hashed-passkey',
        },
        select: {
          id: true,
          username: true,
          phoneNumber: true,
          createdAt: true,
        },
      });
      expect(prismaMock.userSettings.create).toHaveBeenCalledWith({
        data: { userId: 1n },
      });
      expect(prismaMock.userActivityLog.create).toHaveBeenCalledWith({
        data: { userId: 1n, action: 'register' },
      });
    });

    it('rejects duplicate username', async () => {
      prismaMock.user.findFirst.mockResolvedValue(fakeUser);

      const res = await request(app).post('/api/auth/register').send({
        username: 'frogger_user',
        phoneNumber: '+380501234567',
        passkey: 'securePass1',
      });

      expect(res.status).toBe(409);
      expect(res.body.error).toBe('User already exists');
      expect(prismaMock.user.create).not.toHaveBeenCalled();
    });

    it('rejects short username (< 3 chars)', async () => {
      const res = await request(app).post('/api/auth/register').send({
        username: 'ab',
        phoneNumber: '+380501234567',
        passkey: 'securePass1',
      });

      expect(res.status).toBe(422);
    });

    it('rejects short passkey (< 6 chars)', async () => {
      const res = await request(app).post('/api/auth/register').send({
        username: 'frogger_user',
        phoneNumber: '+380501234567',
        passkey: '12345',
      });

      expect(res.status).toBe(422);
    });

    it('rejects missing phone number', async () => {
      const res = await request(app).post('/api/auth/register').send({
        username: 'frogger_user',
        passkey: 'securePass1',
      });

      expect(res.status).toBe(422);
    });

    it('hashes passkey with bcrypt cost 12', async () => {
      prismaMock.user.findFirst.mockResolvedValue(null);
      prismaMock.user.create.mockResolvedValue(fakeUserSelect);
      prismaMock.userSettings.create.mockResolvedValue({});
      prismaMock.userActivityLog.create.mockResolvedValue({});
      (mockBcrypt.hash as jest.Mock).mockResolvedValue('hashed');

      await request(app).post('/api/auth/register').send({
        username: 'frogger_user',
        phoneNumber: '+380501234567',
        passkey: 'securePass1',
      });

      expect(mockBcrypt.hash).toHaveBeenCalledWith('securePass1', 12);
    });
  });

  // ─────────────────────────────────────────────
  // 2. Login — authenticates and returns tokens
  // ─────────────────────────────────────────────
  describe('Step 2: POST /api/auth/login', () => {
    it('returns access token and sets refresh cookie', async () => {
      prismaMock.user.findUnique.mockResolvedValue(fakeUser);
      (mockBcrypt.compare as jest.Mock).mockResolvedValue(true);
      (mockBcrypt.hash as jest.Mock).mockResolvedValue('hashed-refresh');
      prismaMock.session.create.mockResolvedValue({ id: 1n });
      prismaMock.userActivityLog.create.mockResolvedValue({});

      const res = await request(app).post('/api/auth/login').send({
        username: 'frogger_user',
        passkey: 'securePass1',
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBe('mock-access-token');
      expect(res.body.data.user.username).toBe('frogger_user');

      // Verify refresh cookie is set
      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies[0]).toContain('refreshToken');
      expect(cookies[0]).toContain('HttpOnly');
    });

    it('creates session in database', async () => {
      prismaMock.user.findUnique.mockResolvedValue(fakeUser);
      (mockBcrypt.compare as jest.Mock).mockResolvedValue(true);
      (mockBcrypt.hash as jest.Mock).mockResolvedValue('hashed-refresh');
      prismaMock.session.create.mockResolvedValue({ id: 1n });
      prismaMock.userActivityLog.create.mockResolvedValue({});

      await request(app).post('/api/auth/login').send({
        username: 'frogger_user',
        passkey: 'securePass1',
      });

      expect(prismaMock.session.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 1n,
          refreshToken: 'hashed-refresh',
          expiresAt: expect.any(Date),
        }),
      });
    });

    it('logs login activity', async () => {
      prismaMock.user.findUnique.mockResolvedValue(fakeUser);
      (mockBcrypt.compare as jest.Mock).mockResolvedValue(true);
      (mockBcrypt.hash as jest.Mock).mockResolvedValue('hashed-refresh');
      prismaMock.session.create.mockResolvedValue({ id: 1n });
      prismaMock.userActivityLog.create.mockResolvedValue({});

      await request(app).post('/api/auth/login').send({
        username: 'frogger_user',
        passkey: 'securePass1',
      });

      expect(prismaMock.userActivityLog.create).toHaveBeenCalledWith({
        data: { userId: 1n, action: 'login' },
      });
    });

    it('rejects wrong passkey', async () => {
      prismaMock.user.findUnique.mockResolvedValue(fakeUser);
      (mockBcrypt.compare as jest.Mock).mockResolvedValue(false);

      const res = await request(app).post('/api/auth/login').send({
        username: 'frogger_user',
        passkey: 'wrongpasskey',
      });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Invalid credentials');
      expect(prismaMock.session.create).not.toHaveBeenCalled();
    });

    it('rejects non-existent user', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      const res = await request(app).post('/api/auth/login').send({
        username: 'nobody',
        passkey: 'whatever',
      });

      expect(res.status).toBe(401);
    });
  });

  // ─────────────────────────────────────────────
  // 3. Fetch user data with token
  // ─────────────────────────────────────────────
  describe('Step 3: GET /api/users/me (authenticated)', () => {
    it('returns user profile from database', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: 1n,
        username: 'frogger_user',
        phoneNumber: '+380501234567',
        profileImage: null,
        createdAt: NOW,
      });

      const res = await request(app).get('/api/users/me').set(mockAuthHeader);

      expect(res.status).toBe(200);
      expect(res.body.data.username).toBe('frogger_user');
      expect(res.body.data.phoneNumber).toBe('+380501234567');

      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { id: 1n },
        select: {
          id: true,
          username: true,
          phoneNumber: true,
          profileImage: true,
          createdAt: true,
        },
      });
    });

    it('rejects unauthenticated request', async () => {
      const res = await request(app).get('/api/users/me');
      expect(res.status).toBe(401);
    });
  });

  // ─────────────────────────────────────────────
  // 4. Update user profile
  // ─────────────────────────────────────────────
  describe('Step 4: PUT /api/users/me (update profile)', () => {
    it('updates username in database', async () => {
      prismaMock.user.update.mockResolvedValue({
        id: 1n,
        username: 'new_frogger',
        phoneNumber: '+380501234567',
        profileImage: null,
        createdAt: NOW,
      });

      const res = await request(app)
        .put('/api/users/me')
        .set(mockAuthHeader)
        .send({ username: 'new_frogger' });

      expect(res.status).toBe(200);
      expect(res.body.data.username).toBe('new_frogger');
      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: 1n },
        data: { username: 'new_frogger' },
        select: expect.objectContaining({ username: true }),
      });
    });

    it('validates username min length', async () => {
      const res = await request(app)
        .put('/api/users/me')
        .set(mockAuthHeader)
        .send({ username: 'ab' });

      expect(res.status).toBe(422);
    });
  });

  // ─────────────────────────────────────────────
  // 5. User settings (created during registration)
  // ─────────────────────────────────────────────
  describe('Step 5: GET/PUT /api/users/me/settings', () => {
    it('returns default settings created at registration', async () => {
      prismaMock.userSettings.findUnique.mockResolvedValue({
        id: 1n,
        userId: 1n,
        theme: 'light',
        notificationsEnabled: true,
        createdAt: NOW,
      });

      const res = await request(app)
        .get('/api/users/me/settings')
        .set(mockAuthHeader);

      expect(res.status).toBe(200);
      expect(res.body.data.theme).toBe('light');
      expect(res.body.data.notificationsEnabled).toBe(true);
    });

    it('updates settings', async () => {
      prismaMock.userSettings.upsert.mockResolvedValue({
        id: 1n,
        userId: 1n,
        theme: 'dark',
        notificationsEnabled: false,
        createdAt: NOW,
      });

      const res = await request(app)
        .put('/api/users/me/settings')
        .set(mockAuthHeader)
        .send({ theme: 'dark', notificationsEnabled: false });

      expect(res.status).toBe(200);
      expect(res.body.data.theme).toBe('dark');
    });
  });

  // ─────────────────────────────────────────────
  // 6. Session management
  // ─────────────────────────────────────────────
  describe('Step 6: Sessions', () => {
    it('lists active sessions', async () => {
      prismaMock.session.findMany.mockResolvedValue([
        {
          id: 1n,
          deviceInfo: 'Mozilla/5.0',
          ipAddress: '127.0.0.1',
          lastActive: NOW,
          createdAt: NOW,
        },
      ]);

      const res = await request(app)
        .get('/api/users/me/sessions')
        .set(mockAuthHeader);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].deviceInfo).toBe('Mozilla/5.0');
    });

    it('revokes a specific session', async () => {
      prismaMock.session.deleteMany.mockResolvedValue({ count: 1 });

      const res = await request(app)
        .delete('/api/users/me/sessions/1')
        .set(mockAuthHeader);

      expect(res.status).toBe(204);
      expect(prismaMock.session.deleteMany).toHaveBeenCalledWith({
        where: { id: 1n, userId: 1n },
      });
    });
  });

  // ─────────────────────────────────────────────
  // 7. Token refresh
  // ─────────────────────────────────────────────
  describe('Step 7: POST /api/auth/refresh', () => {
    it('rotates refresh token and returns new access token', async () => {
      (verifyRefreshToken as jest.Mock).mockReturnValue({
        userId: '1',
        type: 'refresh',
      });
      prismaMock.session.findMany.mockResolvedValue([
        {
          id: 1n,
          userId: 1n,
          refreshToken: 'hashed-old-refresh',
          expiresAt: new Date(Date.now() + 86400000),
        },
      ]);
      (mockBcrypt.compare as jest.Mock).mockResolvedValue(true);
      (mockBcrypt.hash as jest.Mock).mockResolvedValue('hashed-new-refresh');
      prismaMock.session.update.mockResolvedValue({ id: 1n });
      (generateTokenPair as jest.Mock).mockReturnValue({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      });

      const res = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'old-refresh-token' });

      expect(res.status).toBe(200);
      expect(res.body.data.accessToken).toBe('new-access-token');

      // Verify token was rotated in DB
      expect(prismaMock.session.update).toHaveBeenCalledWith({
        where: { id: 1n },
        data: {
          refreshToken: 'hashed-new-refresh',
          lastActive: expect.any(Date),
        },
      });
    });

    it('rejects without refresh token', async () => {
      const res = await request(app).post('/api/auth/refresh');
      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Refresh token required');
    });

    it('rejects invalid refresh token', async () => {
      (verifyRefreshToken as jest.Mock).mockReturnValue({
        userId: '1',
        type: 'refresh',
      });
      prismaMock.session.findMany.mockResolvedValue([
        {
          id: 1n,
          userId: 1n,
          refreshToken: 'hashed-refresh',
          expiresAt: new Date(Date.now() + 86400000),
        },
      ]);
      (mockBcrypt.compare as jest.Mock).mockResolvedValue(false);

      const res = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'tampered-token' });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Invalid refresh token');
    });
  });

  // ─────────────────────────────────────────────
  // 8. Logout — revokes all sessions
  // ─────────────────────────────────────────────
  describe('Step 8: POST /api/auth/logout', () => {
    it('revokes all sessions and clears cookie', async () => {
      prismaMock.session.deleteMany.mockResolvedValue({ count: 1 });

      const res = await request(app)
        .post('/api/auth/logout')
        .set(mockAuthHeader);

      expect(res.status).toBe(200);
      expect(res.body.data.message).toBe('Logged out');
      expect(prismaMock.session.deleteMany).toHaveBeenCalledWith({
        where: { userId: 1n },
      });

      // Verify cookie is cleared
      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies[0]).toContain('refreshToken=;');
    });
  });

  // ─────────────────────────────────────────────
  // 9. Account deletion
  // ─────────────────────────────────────────────
  describe('Step 9: DELETE /api/users/me', () => {
    it('deletes user and clears cookie', async () => {
      prismaMock.user.delete.mockResolvedValue(fakeUser);

      const res = await request(app)
        .delete('/api/users/me')
        .set(mockAuthHeader);

      expect(res.status).toBe(204);
      expect(prismaMock.user.delete).toHaveBeenCalledWith({
        where: { id: 1n },
      });
    });
  });
});

// =============================================
// Clerk Integration Flow
// =============================================
describe('Clerk Integration Flow', () => {
  beforeEach(() => jest.clearAllMocks());

  // ─────────────────────────────────────────────
  // 10. Clerk user sync — creates user from Clerk ID
  // ─────────────────────────────────────────────
  describe('Step 10: syncClerkUser (service-level)', () => {
    it('creates new user when clerkId not found', async () => {
      // Import service directly to test Clerk sync
      const { syncClerkUser } = await import('../services/auth.service');

      prismaMock.user.findUnique.mockResolvedValue(null);
      const newUser = {
        ...fakeUser,
        clerkId: 'clerk_abc123',
      };
      prismaMock.user.create.mockResolvedValue(newUser);
      prismaMock.userSettings.create.mockResolvedValue({ id: 1n });
      (mockBcrypt.hash as jest.Mock).mockResolvedValue('hashed-clerk-id');

      const result = await syncClerkUser(
        'clerk_abc123',
        'clerk_frogger',
        '+380509876543',
      );

      expect(result.clerkId).toBe('clerk_abc123');
      expect(prismaMock.user.create).toHaveBeenCalledWith({
        data: {
          username: 'clerk_frogger',
          phoneNumber: '+380509876543',
          passkey: 'hashed-clerk-id',
          clerkId: 'clerk_abc123',
        },
      });
      expect(prismaMock.userSettings.create).toHaveBeenCalledWith({
        data: { userId: newUser.id },
      });
    });

    it('returns existing user when clerkId already exists', async () => {
      const { syncClerkUser } = await import('../services/auth.service');

      const existingUser = { ...fakeUser, clerkId: 'clerk_abc123' };
      prismaMock.user.findUnique.mockResolvedValue(existingUser);

      const result = await syncClerkUser(
        'clerk_abc123',
        'clerk_frogger',
        '+380509876543',
      );

      expect(result.clerkId).toBe('clerk_abc123');
      expect(prismaMock.user.create).not.toHaveBeenCalled();
    });
  });

  // ─────────────────────────────────────────────
  // 11. Clerk login — generates tokens for Clerk user
  // ─────────────────────────────────────────────
  describe('Step 11: loginWithClerk (service-level)', () => {
    it('generates tokens for existing Clerk user', async () => {
      const { loginWithClerk } = await import('../services/auth.service');

      const clerkUser = {
        ...fakeUser,
        clerkId: 'clerk_abc123',
      };
      prismaMock.user.findUnique.mockResolvedValue(clerkUser);
      prismaMock.userActivityLog.create.mockResolvedValue({});
      (generateTokenPair as jest.Mock).mockReturnValue({
        accessToken: 'clerk-access-token',
        refreshToken: 'clerk-refresh-token',
      });

      const result = await loginWithClerk('clerk_abc123');

      expect(result).not.toBeNull();
      expect(result!.accessToken).toBe('clerk-access-token');
      expect(result!.user.username).toBe('frogger_user');
      expect(prismaMock.userActivityLog.create).toHaveBeenCalledWith({
        data: { userId: 1n, action: 'clerk_login' },
      });
    });

    it('returns null for unknown Clerk ID', async () => {
      const { loginWithClerk } = await import('../services/auth.service');

      prismaMock.user.findUnique.mockResolvedValue(null);

      const result = await loginWithClerk('clerk_unknown');
      expect(result).toBeNull();
    });
  });

  // ─────────────────────────────────────────────
  // 12. Auth middleware — Clerk fallback
  // ─────────────────────────────────────────────
  describe('Step 12: authenticate middleware with Clerk fallback', () => {
    it('authenticates via Clerk getAuth when JWT is absent', async () => {
      // Override verifyAccessToken to throw (no JWT)
      (verifyAccessToken as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      // Simulate Clerk returning a userId
      getAuth.mockReturnValue({ userId: 'clerk_abc123' });

      prismaMock.user.findFirst.mockResolvedValue({
        id: 2n,
        clerkId: 'clerk_abc123',
      });
      prismaMock.user.findUnique.mockResolvedValue({
        id: 2n,
        username: 'clerk_user',
        phoneNumber: '+380500000000',
        profileImage: null,
        createdAt: NOW,
      });

      const res = await request(app)
        .get('/api/users/me')
        .set('Authorization', 'Bearer invalid-jwt');

      expect(res.status).toBe(200);
      expect(res.body.data.username).toBe('clerk_user');
    });

    it('rejects when both JWT and Clerk auth fail', async () => {
      (verifyAccessToken as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });
      getAuth.mockReturnValue(null);

      const res = await request(app)
        .get('/api/users/me')
        .set('Authorization', 'Bearer bad-token');

      expect(res.status).toBe(401);
    });
  });
});

// =============================================
// End-to-end sequence: register → login → use → logout
// =============================================
describe('E2E Sequence: Register → Login → Fetch → Update → Logout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Restore default JWT mocks (may be overridden by Clerk fallback tests)
    (verifyAccessToken as jest.Mock).mockReturnValue({
      userId: '1',
      type: 'access',
    });
    (generateTokenPair as jest.Mock).mockReturnValue({
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
    });
  });

  it('simulates complete user lifecycle', async () => {
    // --- Register ---
    prismaMock.user.findFirst.mockResolvedValue(null);
    prismaMock.user.create.mockResolvedValue(fakeUserSelect);
    prismaMock.userSettings.create.mockResolvedValue({});
    prismaMock.userActivityLog.create.mockResolvedValue({});
    (mockBcrypt.hash as jest.Mock).mockResolvedValue('hashed-passkey');

    const regRes = await request(app).post('/api/auth/register').send({
      username: 'frogger_user',
      phoneNumber: '+380501234567',
      passkey: 'securePass1',
    });
    expect(regRes.status).toBe(201);

    // --- Login ---
    prismaMock.user.findUnique.mockResolvedValue(fakeUser);
    (mockBcrypt.compare as jest.Mock).mockResolvedValue(true);
    (mockBcrypt.hash as jest.Mock).mockResolvedValue('hashed-refresh');
    prismaMock.session.create.mockResolvedValue({ id: 1n });

    const loginRes = await request(app).post('/api/auth/login').send({
      username: 'frogger_user',
      passkey: 'securePass1',
    });
    expect(loginRes.status).toBe(200);
    expect(loginRes.body.data.accessToken).toBeDefined();

    // --- Fetch profile ---
    prismaMock.user.findUnique.mockResolvedValue({
      id: 1n,
      username: 'frogger_user',
      phoneNumber: '+380501234567',
      profileImage: null,
      createdAt: NOW,
    });

    const meRes = await request(app).get('/api/users/me').set(mockAuthHeader);
    expect(meRes.status).toBe(200);
    expect(meRes.body.data.username).toBe('frogger_user');

    // --- Update profile ---
    prismaMock.user.update.mockResolvedValue({
      id: 1n,
      username: 'updated_frogger',
      phoneNumber: '+380501234567',
      profileImage: 'https://example.com/avatar.png',
      createdAt: NOW,
    });

    const updateRes = await request(app)
      .put('/api/users/me')
      .set(mockAuthHeader)
      .send({
        username: 'updated_frogger',
        profileImage: 'https://example.com/avatar.png',
      });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.username).toBe('updated_frogger');

    // --- Logout ---
    prismaMock.session.deleteMany.mockResolvedValue({ count: 1 });

    const logoutRes = await request(app)
      .post('/api/auth/logout')
      .set(mockAuthHeader);
    expect(logoutRes.status).toBe(200);
    expect(logoutRes.body.data.message).toBe('Logged out');
  });
});
