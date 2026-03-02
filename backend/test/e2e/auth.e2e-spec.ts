import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types';
import session from 'express-session';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * E2E tests for the Auth module.
 *
 * These tests use a mocked PrismaService so they don't need a real database.
 * They exercise the full HTTP request lifecycle including session middleware.
 */
describe('Auth (e2e)', () => {
  let app: INestApplication<App>;

  // Mock Prisma data
  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    session: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
      delete: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    $connect: jest.fn(),
    $disconnect: jest.fn(),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrisma)
      .compile();

    app = moduleFixture.createNestApplication();

    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
    );

    // Configure session middleware (mirrors main.ts)
    app.use(
      session({
        secret: 'test-secret',
        resave: false,
        saveUninitialized: false,
        cookie: { httpOnly: true, secure: false },
      }),
    );

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.resetAllMocks();
  });

  // ─────────────────────────────────────────
  //  EMAIL REGISTRATION
  // ─────────────────────────────────────────

  describe('POST /auth/register', () => {
    it('should register a new user and return 201', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({
        id: 1n,
        email: 'new@example.com',
        username: 'newuser',
        passwordHash: 'hashed',
      });

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'new@example.com',
          password: 'securepass123',
          username: 'newuser',
        })
        .expect(HttpStatus.CREATED);

      expect(response.body.userId).toBeDefined();
      expect(response.body.email).toBe('new@example.com');
      expect(response.body.message).toContain('Registered');
    });

    it('should reject registration with invalid email', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'not-an-email',
          password: 'securepass123',
          username: 'user',
        })
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should reject registration with short password', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'test@example.com',
          password: 'short',
          username: 'user',
        })
        .expect(HttpStatus.BAD_REQUEST);
    });
  });

  // ─────────────────────────────────────────
  //  EMAIL LOGIN
  // ─────────────────────────────────────────

  describe('POST /auth/login', () => {
    it('should reject login with non-existent user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'nobody@example.com', password: 'pass' })
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  // ─────────────────────────────────────────
  //  GITHUB OAUTH
  // ─────────────────────────────────────────

  describe('GET /auth/github', () => {
    it('should redirect to GitHub', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/github')
        .expect(HttpStatus.FOUND);

      expect(response.headers.location).toContain(
        'github.com/login/oauth/authorize',
      );
    });
  });

  // ─────────────────────────────────────────
  //  TELEGRAM
  // ─────────────────────────────────────────

  describe('POST /auth/telegram', () => {
    it('should reject invalid Telegram auth data', async () => {
      await request(app.getHttpServer())
        .post('/auth/telegram')
        .send({
          id: 123,
          auth_date: Math.floor(Date.now() / 1000),
          hash: 'invalid-hash',
        })
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  // ─────────────────────────────────────────
  //  PROTECTED ROUTES (no session)
  // ─────────────────────────────────────────

  describe('Protected endpoints without authentication', () => {
    it('GET /auth/me should return 401', async () => {
      await request(app.getHttpServer())
        .get('/auth/me')
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('GET /auth/sessions should return 401', async () => {
      await request(app.getHttpServer())
        .get('/auth/sessions')
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('DELETE /auth/sessions/:id should return 401', async () => {
      await request(app.getHttpServer())
        .delete('/auth/sessions/some-session-id')
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('POST /auth/logout should return 401', async () => {
      await request(app.getHttpServer())
        .post('/auth/logout')
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('POST /auth/logout/all should return 401', async () => {
      await request(app.getHttpServer())
        .post('/auth/logout/all')
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  // ─────────────────────────────────────────
  //  FULL EMAIL REGISTRATION + LOGIN FLOW
  // ─────────────────────────────────────────

  describe('Register → Login → Session flow', () => {
    it('should register, then access /auth/me with session', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({
        id: 100n,
        email: 'flow@example.com',
        username: 'flowuser',
        passwordHash: 'hashed',
      });

      const agent = request.agent(app.getHttpServer());

      // Step 1: Register (auto-login)
      const registerRes = await agent
        .post('/auth/register')
        .send({
          email: 'flow@example.com',
          password: 'securepass123',
          username: 'flowuser',
        })
        .expect(HttpStatus.CREATED);

      expect(registerRes.body.userId).toBeDefined();

      // Step 2: Access /auth/me (should have session)
      const meRes = await agent.get('/auth/me').expect(HttpStatus.OK);

      expect(meRes.body.userId).toBeDefined();
      expect(meRes.body.email).toBe('flow@example.com');
    });
  });
});
