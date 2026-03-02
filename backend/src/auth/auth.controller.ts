import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Req,
  Res,
  Query,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { EmailAuthService } from './email-auth.service.js';
import { GithubAuthService } from './github-auth.service.js';
import { TelegramAuthService } from './telegram-auth.service.js';
import { SessionService } from './session.service.js';
import { SessionGuard } from './guards/session.guard.js';
import { RegisterDto, LoginDto, TelegramAuthDto } from './dto/index.js';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly emailAuth: EmailAuthService,
    private readonly githubAuth: GithubAuthService,
    private readonly telegramAuth: TelegramAuthService,
    private readonly sessionService: SessionService,
  ) {}

  // ───────────────────────────────────────────────
  //  A. EMAIL + PASSWORD
  // ───────────────────────────────────────────────

  /**
   * Register a new user with email and password.
   * POST /auth/register
   */
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() dto: RegisterDto, @Req() req: Request) {
    const result = await this.emailAuth.register(
      dto.email,
      dto.password,
      dto.username,
    );

    // Auto-login after registration
    this.sessionService.createSession(req, result.userId, result.email!);

    return {
      userId: result.userId,
      email: result.email,
      username: result.username,
      message: 'Registered and logged in successfully',
    };
  }

  /**
   * Login with email and password.
   * POST /auth/login
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto, @Req() req: Request) {
    const result = await this.emailAuth.login(dto.email, dto.password);

    this.sessionService.createSession(req, result.userId, result.email);

    return {
      userId: result.userId,
      email: result.email,
      username: result.username,
      message: 'Logged in successfully',
    };
  }

  // ───────────────────────────────────────────────
  //  B. GITHUB OAUTH
  // ───────────────────────────────────────────────

  /**
   * Redirect the user to GitHub OAuth page.
   * GET /auth/github
   */
  @Get('github')
  githubRedirect(@Res() res: Response) {
    const url = this.githubAuth.getAuthorizationUrl();
    res.redirect(url);
  }

  /**
   * Handle GitHub OAuth callback.
   * GET /auth/github/callback?code=...
   */
  @Get('github/callback')
  async githubCallback(
    @Query('code') code: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    if (!code) {
      throw new BadRequestException('Missing authorization code');
    }

    const result = await this.githubAuth.handleCallback(code);
    this.sessionService.createSession(req, result.userId, result.email ?? '');

    // Redirect to frontend after successful login
    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:5173';
    res.redirect(`${frontendUrl}/auth/success`);
  }

  // ───────────────────────────────────────────────
  //  C. TELEGRAM LOGIN WIDGET
  // ───────────────────────────────────────────────

  /**
   * Verify Telegram Login Widget data and create a session.
   * POST /auth/telegram
   */
  @Post('telegram')
  @HttpCode(HttpStatus.OK)
  async telegramLogin(@Body() dto: TelegramAuthDto, @Req() req: Request) {
    const result = await this.telegramAuth.authenticate(dto);

    this.sessionService.createSession(req, result.userId, result.email ?? '');

    return {
      userId: result.userId,
      email: result.email,
      username: result.username,
      message: 'Logged in via Telegram successfully',
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
      email: req.session.email,
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
