import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Req,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import type { Request } from 'express';
import { OtpService } from './otp.service.js';
import { WebAuthnService } from './webauthn.service.js';
import { SessionService } from './session.service.js';
import { SessionGuard } from './guards/session.guard.js';
import {
  SendOtpDto,
  VerifyOtpDto,
  VerifyRegistrationDto,
  VerifyAuthenticationDto,
} from './dto/index.js';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly otpService: OtpService,
    private readonly webAuthnService: WebAuthnService,
    private readonly sessionService: SessionService,
  ) {}

  // ───────────────────────────────────────────────
  //  A. REGISTRATION FLOW
  // ───────────────────────────────────────────────

  /**
   * 1) Send OTP to the given phone number.
   * POST /auth/otp/send
   */
  @Post('otp/send')
  @HttpCode(HttpStatus.OK)
  async sendOtp(@Body() dto: SendOtpDto) {
    return this.otpService.sendOtp(dto.phoneNumber);
  }

  /**
   * 2) Verify OTP.  On success the phone number is marked as verified
   *    and the server returns WebAuthn registration options (challenge).
   * POST /auth/otp/verify
   */
  @Post('otp/verify')
  @HttpCode(HttpStatus.OK)
  async verifyOtpAndGetRegistrationOptions(
    @Body() dto: VerifyOtpDto,
    @Req() req: Request,
  ) {
    const valid = await this.otpService.verifyOtp(dto.phoneNumber, dto.code);
    if (!valid) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    // Mark phone verified in session (temporary, pre-registration)
    req.session.verifiedPhone = dto.phoneNumber;

    // Generate WebAuthn registration options
    const options = await this.webAuthnService.generateRegistrationOptions(
      dto.phoneNumber,
    );

    return { otpVerified: true, registrationOptions: options };
  }

  /**
   * 3) Frontend calls startRegistration(), sends result here.
   *    Backend verifies & saves the public key credential.
   * POST /auth/register/verify
   */
  @Post('register/verify')
  @HttpCode(HttpStatus.CREATED)
  async verifyRegistration(
    @Body() dto: VerifyRegistrationDto,
    @Req() req: Request,
  ) {
    const phoneNumber = dto.phoneNumber || req.session.verifiedPhone;

    if (!phoneNumber) {
      throw new BadRequestException(
        'Phone number not verified. Complete OTP step first.',
      );
    }

    const result = await this.webAuthnService.verifyRegistration(
      phoneNumber,
      dto.credential,
    );

    // Auto-login after registration
    this.sessionService.createSession(req, result.userId, phoneNumber);

    return {
      verified: result.verified,
      userId: result.userId,
      message: 'Passkey registered & logged in successfully',
    };
  }

  // ───────────────────────────────────────────────
  //  B. LOGIN (ASSERTION) FLOW
  // ───────────────────────────────────────────────

  /**
   * 1) Generate authentication options (discoverable credentials).
   * GET /auth/login/options
   */
  @Get('login/options')
  async getLoginOptions() {
    const options = await this.webAuthnService.generateAuthenticationOptions();
    return { authenticationOptions: options };
  }

  /**
   * 2) Verify the authentication assertion and create a session.
   * POST /auth/login/verify
   */
  @Post('login/verify')
  @HttpCode(HttpStatus.OK)
  async verifyLogin(@Body() dto: VerifyAuthenticationDto, @Req() req: Request) {
    const result = await this.webAuthnService.verifyAuthentication(
      dto.credential,
    );

    // Create session
    this.sessionService.createSession(
      req,
      result.user.id.toString(),
      result.user.phoneNumber,
    );

    return {
      verified: true,
      userId: result.user.id.toString(),
      message: 'Logged in successfully',
    };
  }

  // ───────────────────────────────────────────────
  //  SESSION MANAGEMENT
  // ───────────────────────────────────────────────

  /**
   * Get the currently authenticated user's info.
   * GET /auth/me
   */
  @UseGuards(SessionGuard)
  @Get('me')
  me(@Req() req: Request) {
    return {
      userId: req.session.userId,
      phoneNumber: req.session.phoneNumber,
      sessionId: req.sessionID,
      userAgent: req.session.userAgent,
      ip: req.session.ip,
      createdAt: req.session.createdAt,
    };
  }

  /**
   * List all active sessions for the current user.
   * GET /auth/sessions
   */
  @UseGuards(SessionGuard)
  @Get('sessions')
  async listSessions(@Req() req: Request) {
    const userId = req.session.userId;
    if (!userId) throw new BadRequestException('No active session');
    const sessions = await this.sessionService.listUserSessions(userId);
    return { sessions, currentSessionId: req.sessionID };
  }

  /**
   * Destroy a specific session (remote logout).
   * DELETE /auth/sessions/:sessionId
   */
  @UseGuards(SessionGuard)
  @Delete('sessions/:sessionId')
  @HttpCode(HttpStatus.OK)
  async destroySession(
    @Param('sessionId') sessionId: string,
    @Req() req: Request,
  ) {
    // Prevent destroying someone else's session
    const userId = req.session.userId;
    if (!userId) throw new BadRequestException('No active session');
    const userSessions = await this.sessionService.listUserSessions(userId);
    const ownsSession = userSessions.some((s) => s.sessionId === sessionId);

    if (!ownsSession) {
      throw new BadRequestException('Session not found');
    }

    await this.sessionService.destroySession(sessionId);
    return { message: 'Session destroyed' };
  }

  /**
   * Logout current session.
   * POST /auth/logout
   */
  @UseGuards(SessionGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: Request) {
    return new Promise<{ message: string }>((resolve, reject) => {
      req.session.destroy((err) => {
        if (err) {
          reject(
            err instanceof Error ? err : new Error('Session destroy failed'),
          );
          return;
        }
        resolve({ message: 'Logged out successfully' });
      });
    });
  }

  /**
   * Logout from all devices.
   * POST /auth/logout/all
   */
  @UseGuards(SessionGuard)
  @Post('logout/all')
  @HttpCode(HttpStatus.OK)
  async logoutAll(@Req() req: Request) {
    const userId = req.session.userId;
    if (!userId) throw new BadRequestException('No active session');
    const count = await this.sessionService.destroyAllUserSessions(userId);
    return { message: `Destroyed ${count} session(s)` };
  }
}
