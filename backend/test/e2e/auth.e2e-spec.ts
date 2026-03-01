import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus } from '@nestjs/common';
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
    otpChallenge: {
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    user: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    credential: {
      create: jest.fn(),
      findUnique: jest.fn(),
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
    jest.clearAllMocks();
  });

  // ─────────────────────────────────────────
  //  OTP FLOW
  // ─────────────────────────────────────────

  describe('POST /auth/otp/send', () => {
    it('should send OTP and return 200', async () => {
      mockPrisma.otpChallenge.create.mockResolvedValue({
        id: 1n,
        phoneNumber: '+1234567890',
        code: '123456',
        expiresAt: new Date(),
      });

      const response = await request(app.getHttpServer())
        .post('/auth/otp/send')
        .send({ phoneNumber: '+1234567890' })
        .expect(HttpStatus.OK);

      expect(response.body).toEqual({ message: 'OTP sent successfully' });
    });
  });

  describe('POST /auth/otp/verify', () => {
    it('should reject invalid OTP with 400', async () => {
      mockPrisma.otpChallenge.findFirst.mockResolvedValue(null);

      await request(app.getHttpServer())
        .post('/auth/otp/verify')
        .send({ phoneNumber: '+1234567890', code: '000000' })
        .expect(HttpStatus.BAD_REQUEST);
    });
  });

  // ─────────────────────────────────────────
  //  REGISTRATION FLOW
  // ─────────────────────────────────────────

  describe('POST /auth/register/verify', () => {
    it('should reject when no phone number verified', async () => {
      // No OTP verified in session, no phoneNumber in body
      await request(app.getHttpServer())
        .post('/auth/register/verify')
        .send({ phoneNumber: '', credential: {} })
        .expect(HttpStatus.BAD_REQUEST);
    });
  });

  // ─────────────────────────────────────────
  //  LOGIN FLOW
  // ─────────────────────────────────────────

  describe('GET /auth/login/options', () => {
    it('should return authentication options', async () => {
      // The WebAuthnService calls generateAuthenticationOptions from simplewebauthn
      // In e2e, the real service is used, so this may fail if simplewebauthn
      // can't be called without proper setup. We test that the endpoint exists.
      const response = await request(app.getHttpServer()).get(
        '/auth/login/options',
      );

      // Should return 200 with authenticationOptions
      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body).toHaveProperty('authenticationOptions');
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
  //  FULL INTEGRATION FLOW (OTP → session)
  // ─────────────────────────────────────────

  describe('OTP → verify → session flow', () => {
    it('should set verifiedPhone in session after valid OTP', async () => {
      // Set up mocks for successful OTP verification
      mockPrisma.otpChallenge.findFirst.mockResolvedValue({
        id: 1n,
        phoneNumber: '+1234567890',
        code: '999999',
        verified: false,
        expiresAt: new Date(Date.now() + 300_000),
      });
      mockPrisma.otpChallenge.update.mockResolvedValue({
        id: 1n,
        verified: true,
      });

      // The WebAuthnService will be called with the real module.
      // We only need user lookup to return null (no excludeCredentials).
      mockPrisma.user.findFirst.mockResolvedValue(null);

      const agent = request.agent(app.getHttpServer());

      // Step 1: Verify OTP
      const otpResponse = await agent
        .post('/auth/otp/verify')
        .send({ phoneNumber: '+1234567890', code: '999999' });

      expect(otpResponse.status).toBe(HttpStatus.OK);
      expect(otpResponse.body.otpVerified).toBe(true);
      expect(otpResponse.body.registrationOptions).toBeDefined();
      expect(otpResponse.body.registrationOptions.challenge).toBeDefined();
    });
  });
});
