import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { AuthController } from '../../../src/auth/auth.controller';
import { EmailAuthService } from '../../../src/auth/email-auth.service';
import { GithubAuthService } from '../../../src/auth/github-auth.service';
import { TelegramAuthService } from '../../../src/auth/telegram-auth.service';
import { SessionService } from '../../../src/auth/session.service';
import type { Request, Response } from 'express';

describe('AuthController', () => {
  let controller: AuthController;
  let emailAuth: {
    register: jest.Mock;
    login: jest.Mock;
  };
  let githubAuth: {
    getAuthorizationUrl: jest.Mock;
    handleCallback: jest.Mock;
  };
  let telegramAuth: {
    authenticate: jest.Mock;
  };
  let sessionService: {
    createSession: jest.Mock;
    listUserSessions: jest.Mock;
    destroySession: jest.Mock;
    destroyAllUserSessions: jest.Mock;
  };

  const mockRequest = (overrides: Partial<Request> = {}): Request => {
    const session: Record<string, unknown> & {
      destroy: jest.Mock;
    } = {
      userId: undefined,
      email: undefined,
      userAgent: undefined,
      ip: undefined,
      createdAt: undefined,
      destroy: jest.fn((cb: (err?: Error) => void) => cb()),
    };
    return {
      session,
      sessionID: 'test-session-id',
      headers: { 'user-agent': 'TestAgent' },
      ip: '127.0.0.1',
      socket: { remoteAddress: '127.0.0.1' },
      ...overrides,
    } as unknown as Request;
  };

  const mockResponse = (): Response => {
    return {
      redirect: jest.fn(),
    } as unknown as Response;
  };

  beforeEach(async () => {
    emailAuth = {
      register: jest.fn(),
      login: jest.fn(),
    };
    githubAuth = {
      getAuthorizationUrl: jest.fn(),
      handleCallback: jest.fn(),
    };
    telegramAuth = {
      authenticate: jest.fn(),
    };
    sessionService = {
      createSession: jest.fn(),
      listUserSessions: jest.fn(),
      destroySession: jest.fn(),
      destroyAllUserSessions: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: EmailAuthService, useValue: emailAuth },
        { provide: GithubAuthService, useValue: githubAuth },
        { provide: TelegramAuthService, useValue: telegramAuth },
        { provide: SessionService, useValue: sessionService },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  // ─────────────────────────────────────
  //  EMAIL + PASSWORD
  // ─────────────────────────────────────

  describe('POST /auth/register', () => {
    it('should register user and auto-login', async () => {
      emailAuth.register.mockResolvedValue({
        userId: '1',
        email: 'test@example.com',
        username: 'testuser',
      });
      const req = mockRequest();

      const result = await controller.register(
        {
          email: 'test@example.com',
          password: 'password123',
          username: 'testuser',
        },
        req,
      );

      expect(result.userId).toBe('1');
      expect(result.email).toBe('test@example.com');
      expect(result.message).toContain('Registered');
      expect(sessionService.createSession).toHaveBeenCalledWith(
        req,
        '1',
        'test@example.com',
      );
    });
  });

  describe('POST /auth/login', () => {
    it('should login and create session', async () => {
      emailAuth.login.mockResolvedValue({
        userId: '42',
        email: 'user@example.com',
        username: 'user42',
      });
      const req = mockRequest();

      const result = await controller.login(
        { email: 'user@example.com', password: 'pass' },
        req,
      );

      expect(result.userId).toBe('42');
      expect(result.message).toContain('Logged in');
      expect(sessionService.createSession).toHaveBeenCalledWith(
        req,
        '42',
        'user@example.com',
      );
    });
  });

  // ─────────────────────────────────────
  //  GITHUB OAUTH
  // ─────────────────────────────────────

  describe('GET /auth/github', () => {
    it('should redirect to GitHub authorization URL', () => {
      githubAuth.getAuthorizationUrl.mockReturnValue(
        'https://github.com/login/oauth/authorize?client_id=test',
      );
      const res = mockResponse();

      controller.githubRedirect(res);

      expect(res.redirect).toHaveBeenCalledWith(
        'https://github.com/login/oauth/authorize?client_id=test',
      );
    });
  });

  describe('GET /auth/github/callback', () => {
    it('should handle callback and redirect to frontend', async () => {
      githubAuth.handleCallback.mockResolvedValue({
        userId: '5',
        email: 'ghuser@example.com',
        username: 'ghuser',
      });
      const req = mockRequest();
      const res = mockResponse();

      await controller.githubCallback('auth-code', req, res);

      expect(sessionService.createSession).toHaveBeenCalledWith(
        req,
        '5',
        'ghuser@example.com',
      );
      expect(res.redirect).toHaveBeenCalled();
    });

    it('should throw BadRequestException when code is missing', async () => {
      const req = mockRequest();
      const res = mockResponse();

      await expect(controller.githubCallback('', req, res)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  // ─────────────────────────────────────
  //  TELEGRAM
  // ─────────────────────────────────────

  describe('POST /auth/telegram', () => {
    it('should authenticate via Telegram and create session', async () => {
      telegramAuth.authenticate.mockResolvedValue({
        userId: '7',
        email: null,
        username: 'teleuser',
      });
      const req = mockRequest();

      const result = await controller.telegramLogin(
        {
          id: 123,
          first_name: 'Test',
          auth_date: Math.floor(Date.now() / 1000),
          hash: 'valid-hash',
        },
        req,
      );

      expect(result.userId).toBe('7');
      expect(result.message).toContain('Telegram');
      expect(sessionService.createSession).toHaveBeenCalledWith(req, '7', '');
    });
  });

  // ─────────────────────────────────────
  //  SESSION MANAGEMENT
  // ─────────────────────────────────────

  describe('GET /auth/me', () => {
    it('should return current user session info', () => {
      const req = mockRequest();
      req.session.userId = 'user-42';
      req.session.email = 'test@example.com';
      req.session.userAgent = 'TestBrowser';
      req.session.ip = '10.0.0.1';
      req.session.createdAt = 1700000000000;

      const result = controller.me(req);

      expect(result).toEqual({
        userId: 'user-42',
        email: 'test@example.com',
        sessionId: 'test-session-id',
        userAgent: 'TestBrowser',
        ip: '10.0.0.1',
        createdAt: 1700000000000,
      });
    });
  });

  describe('GET /auth/sessions', () => {
    it('should list all user sessions', async () => {
      const req = mockRequest();
      req.session.userId = 'user-42';
      sessionService.listUserSessions.mockResolvedValue([
        { sessionId: 'sess-1', userAgent: 'Chrome', ip: '1.1.1.1' },
        { sessionId: 'sess-2', userAgent: 'Firefox', ip: '2.2.2.2' },
      ]);

      const result = await controller.listSessions(req);

      expect(result.sessions).toHaveLength(2);
      expect(result.currentSessionId).toBe('test-session-id');
    });

    it('should throw when userId is not present in session', async () => {
      const req = mockRequest();

      await expect(controller.listSessions(req)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('DELETE /auth/sessions/:sessionId', () => {
    it('should destroy a session owned by the user', async () => {
      const req = mockRequest();
      req.session.userId = 'user-42';
      sessionService.listUserSessions.mockResolvedValue([
        { sessionId: 'sess-1' },
        { sessionId: 'sess-2' },
      ]);
      sessionService.destroySession.mockResolvedValue(true);

      const result = await controller.destroySession('sess-1', req);

      expect(result).toEqual({ message: 'Session destroyed' });
      expect(sessionService.destroySession).toHaveBeenCalledWith('sess-1');
    });

    it('should throw when session does not belong to user', async () => {
      const req = mockRequest();
      req.session.userId = 'user-42';
      sessionService.listUserSessions.mockResolvedValue([
        { sessionId: 'sess-1' },
      ]);

      await expect(
        controller.destroySession('sess-other', req),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw when userId is not present in session', async () => {
      const req = mockRequest();

      await expect(controller.destroySession('sess-1', req)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('POST /auth/logout', () => {
    it('should destroy session and return success', async () => {
      const req = mockRequest();

      const result = await controller.logout(req);

      expect(result).toEqual({ message: 'Logged out successfully' });
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(req.session.destroy).toHaveBeenCalled();
    });

    it('should reject when session destroy fails', async () => {
      const req = mockRequest();
      (req.session as any).destroy = jest.fn((cb: (err?: Error) => void) =>
        cb(new Error('fail')),
      );

      await expect(controller.logout(req)).rejects.toThrow('fail');
    });
  });

  describe('POST /auth/logout/all', () => {
    it('should destroy all user sessions', async () => {
      const req = mockRequest();
      req.session.userId = 'user-42';
      sessionService.destroyAllUserSessions.mockResolvedValue(3);

      const result = await controller.logoutAll(req);

      expect(result).toEqual({ message: 'Destroyed 3 session(s)' });
      expect(sessionService.destroyAllUserSessions).toHaveBeenCalledWith(
        'user-42',
      );
    });

    it('should throw when userId is not present in session', async () => {
      const req = mockRequest();

      await expect(controller.logoutAll(req)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
