import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { AuthController } from '../../../src/auth/auth.controller';
import { OtpService } from '../../../src/auth/otp.service';
import { WebAuthnService } from '../../../src/auth/webauthn.service';
import { SessionService } from '../../../src/auth/session.service';
import type { Request } from 'express';

describe('AuthController', () => {
  let controller: AuthController;
  let otpService: {
    sendOtp: jest.Mock;
    verifyOtp: jest.Mock;
  };
  let webAuthnService: {
    generateRegistrationOptions: jest.Mock;
    verifyRegistration: jest.Mock;
    generateAuthenticationOptions: jest.Mock;
    verifyAuthentication: jest.Mock;
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
      phoneNumber: undefined,
      verifiedPhone: undefined,
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

  beforeEach(async () => {
    otpService = {
      sendOtp: jest.fn(),
      verifyOtp: jest.fn(),
    };
    webAuthnService = {
      generateRegistrationOptions: jest.fn(),
      verifyRegistration: jest.fn(),
      generateAuthenticationOptions: jest.fn(),
      verifyAuthentication: jest.fn(),
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
        { provide: OtpService, useValue: otpService },
        { provide: WebAuthnService, useValue: webAuthnService },
        { provide: SessionService, useValue: sessionService },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  // ─────────────────────────────────────
  //  REGISTRATION FLOW
  // ─────────────────────────────────────

  describe('POST /auth/otp/send', () => {
    it('should send OTP and return success message', async () => {
      otpService.sendOtp.mockResolvedValue({
        message: 'OTP sent successfully',
      });

      const result = await controller.sendOtp({ phoneNumber: '+1234567890' });

      expect(result).toEqual({ message: 'OTP sent successfully' });
      expect(otpService.sendOtp).toHaveBeenCalledWith('+1234567890');
    });
  });

  describe('POST /auth/otp/verify', () => {
    it('should verify OTP and return registration options', async () => {
      otpService.verifyOtp.mockResolvedValue(true);
      webAuthnService.generateRegistrationOptions.mockResolvedValue({
        challenge: 'test-challenge',
      });
      const req = mockRequest();

      const result = await controller.verifyOtpAndGetRegistrationOptions(
        { phoneNumber: '+1234567890', code: '123456' },
        req,
      );

      expect(result.otpVerified).toBe(true);
      expect(result.registrationOptions).toEqual({
        challenge: 'test-challenge',
      });
      expect(req.session.verifiedPhone).toBe('+1234567890');
    });

    it('should throw BadRequestException for invalid OTP', async () => {
      otpService.verifyOtp.mockResolvedValue(false);
      const req = mockRequest();

      await expect(
        controller.verifyOtpAndGetRegistrationOptions(
          { phoneNumber: '+1234567890', code: '000000' },
          req,
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('POST /auth/register/verify', () => {
    it('should verify registration and auto-login', async () => {
      webAuthnService.verifyRegistration.mockResolvedValue({
        verified: true,
        userId: '42',
      });
      const req = mockRequest();
      req.session.verifiedPhone = '+1234567890';

      const result = await controller.verifyRegistration(
        { phoneNumber: '+1234567890', credential: {} as any },
        req,
      );

      expect(result.verified).toBe(true);
      expect(result.userId).toBe('42');
      expect(result.message).toBe(
        'Passkey registered & logged in successfully',
      );
      expect(sessionService.createSession).toHaveBeenCalledWith(
        req,
        '42',
        '+1234567890',
      );
    });

    it('should use verifiedPhone from session when dto.phoneNumber is empty', async () => {
      webAuthnService.verifyRegistration.mockResolvedValue({
        verified: true,
        userId: '99',
      });
      const req = mockRequest();
      req.session.verifiedPhone = '+5555555555';

      const result = await controller.verifyRegistration(
        { phoneNumber: '', credential: {} as any },
        req,
      );

      expect(result.verified).toBe(true);
      expect(webAuthnService.verifyRegistration).toHaveBeenCalledWith(
        '+5555555555',
        expect.anything(),
      );
    });

    it('should throw when no phone number available', async () => {
      const req = mockRequest();
      // No verifiedPhone in session, no phoneNumber in dto

      await expect(
        controller.verifyRegistration(
          { phoneNumber: '', credential: {} as any },
          req,
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ─────────────────────────────────────
  //  LOGIN FLOW
  // ─────────────────────────────────────

  describe('GET /auth/login/options', () => {
    it('should return authentication options', async () => {
      webAuthnService.generateAuthenticationOptions.mockResolvedValue({
        challenge: 'auth-challenge',
        allowCredentials: [],
      });

      const result = await controller.getLoginOptions();

      expect(result.authenticationOptions).toEqual({
        challenge: 'auth-challenge',
        allowCredentials: [],
      });
    });
  });

  describe('POST /auth/login/verify', () => {
    it('should verify login and create session', async () => {
      webAuthnService.verifyAuthentication.mockResolvedValue({
        verified: true,
        user: { id: 7n, phoneNumber: '+1234567890' },
      });
      const req = mockRequest();

      const result = await controller.verifyLogin(
        { credential: {} as any },
        req,
      );

      expect(result.verified).toBe(true);
      expect(result.userId).toBe('7');
      expect(result.message).toBe('Logged in successfully');
      expect(sessionService.createSession).toHaveBeenCalledWith(
        req,
        '7',
        '+1234567890',
      );
    });
  });

  // ─────────────────────────────────────
  //  SESSION MANAGEMENT
  // ─────────────────────────────────────

  describe('GET /auth/me', () => {
    it('should return current user session info', () => {
      const req = mockRequest();
      req.session.userId = 'user-42';
      req.session.phoneNumber = '+1234567890';
      req.session.userAgent = 'TestBrowser';
      req.session.ip = '10.0.0.1';
      req.session.createdAt = 1700000000000;

      const result = controller.me(req);

      expect(result).toEqual({
        userId: 'user-42',
        phoneNumber: '+1234567890',
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
      // userId is undefined

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
