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
import { GithubAuthService } from './github-auth.service.js';
import { TelegramAuthService } from './telegram-auth.service.js';
import { SessionService } from './session.service.js';
import { SessionGuard } from './guards/session.guard.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { TelegramAuthDto, TelegramCodeVerifyDto } from './dto/index.js';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly githubAuth: GithubAuthService,
    private readonly telegramAuth: TelegramAuthService,
    private readonly sessionService: SessionService,
    private readonly prisma: PrismaService,
  ) {}

  // ───────────────────────────────────────────────
  //  A. GITHUB OAUTH
  // ───────────────────────────────────────────────

  /**
   * Redirect the user to GitHub OAuth page.
   * GET /auth/github
   */
  @Get('github')
  githubRedirect(
    @Query('mode') modeRaw: string | undefined,
    @Query('returnTo') returnToRaw: string | undefined,
    @Res() res: Response,
  ) {
    const mode = modeRaw === 'popup' ? 'popup' : 'redirect';
    const url = this.githubAuth.getAuthorizationUrl({
      state: this.createGithubState({
        mode,
        returnTo: this.getSafeReturnPath(returnToRaw),
      }),
    });
    res.redirect(url);
  }

  /**
   * Handle GitHub OAuth callback.
   * GET /auth/github/callback?code=...
   */
  @Get('github/callback')
  async githubCallback(
    @Query('code') code: string,
    @Query('state') stateRaw: string | undefined,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    if (!code) {
      throw new BadRequestException('Missing authorization code');
    }

    const result = await this.githubAuth.handleCallback(code);
    this.sessionService.createSession(req, result.userId, result.email ?? '');

    const githubState = this.parseGithubState(stateRaw);
    const redirectPath = githubState.returnTo;

    if (githubState.mode === 'popup') {
      res
        .status(HttpStatus.OK)
        .type('html')
        .send(this.renderGithubPopupResponse(req, redirectPath));
      return;
    }

    const redirectUrl = new URL(
      redirectPath,
      `${req.protocol}://${req.get('host')}`,
    );
    redirectUrl.searchParams.set('auth', 'github-success');
    res.redirect(redirectUrl.pathname + redirectUrl.search);
  }

  // ───────────────────────────────────────────────
  //  B. TELEGRAM LOGIN WIDGET
  // ───────────────────────────────────────────────

  /**
   * Generate one-time Telegram login code.
   * POST /auth/telegram/code/request
   */
  @Post('telegram/code/request')
  @HttpCode(HttpStatus.OK)
  async telegramRequestCode() {
    return this.telegramAuth.createLoginCode();
  }

  /**
   * Verify one-time Telegram login code via bot updates.
   * POST /auth/telegram/code/verify
   */
  @Post('telegram/code/verify')
  @HttpCode(HttpStatus.OK)
  async telegramVerifyCode(
    @Body() dto: TelegramCodeVerifyDto,
    @Req() req: Request,
  ) {
    const result = await this.telegramAuth.authenticateWithCode(dto.code);
    this.sessionService.createSession(req, result.userId, result.email ?? '');

    return {
      userId: result.userId,
      email: result.email,
      username: result.username,
      message: 'Logged in via Telegram code successfully',
    };
  }

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

  /**
   * Handle Telegram Login Widget redirect flow (data-auth-url).
   * GET /auth/telegram/callback
   */
  @Get('telegram/callback')
  async telegramCallback(
    @Query('id') idRaw: string,
    @Query('auth_date') authDateRaw: string,
    @Query('hash') hash: string,
    @Query('first_name') firstName: string | undefined,
    @Query('last_name') lastName: string | undefined,
    @Query('username') username: string | undefined,
    @Query('photo_url') photoUrl: string | undefined,
    @Query('returnTo') returnToRaw: string | undefined,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const id = Number(idRaw);
    const authDate = Number(authDateRaw);

    if (!Number.isFinite(id) || !Number.isFinite(authDate) || !hash) {
      throw new BadRequestException(
        'Missing or invalid Telegram callback data',
      );
    }

    const result = await this.telegramAuth.authenticate({
      id,
      auth_date: authDate,
      hash,
      first_name: firstName,
      last_name: lastName,
      username,
      photo_url: photoUrl,
    });

    this.sessionService.createSession(req, result.userId, result.email ?? '');

    const redirectPath = this.getSafeReturnPath(returnToRaw);
    const redirectUrl = new URL(
      redirectPath,
      `${req.protocol}://${req.get('host')}`,
    );
    redirectUrl.searchParams.set('auth', 'telegram-success');
    res.redirect(redirectUrl.pathname + redirectUrl.search);
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
  async me(@Req() req: Request) {
    const userId = req.session.userId;
    if (!userId) {
      throw new BadRequestException('No active session');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: BigInt(userId) },
      select: {
        username: true,
        email: true,
        githubId: true,
        telegramId: true,
      },
    });

    const authProvider = user?.githubId
      ? 'github'
      : user?.telegramId
        ? 'telegram'
        : 'unknown';

    return {
      userId,
      email: user?.email ?? req.session.email,
      username: user?.username ?? null,
      authProvider,
      sessionId: req.sessionID,
      userAgent: req.session.userAgent,
      ip: req.session.ip,
      createdAt: req.session.createdAt,
      authStatus: {
        github: Boolean(user?.githubId),
        telegram: Boolean(user?.telegramId),
      },
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
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: Request) {
    if (!req.session?.userId) {
      return { message: 'Already logged out' };
    }

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
  @Post('logout/all')
  @HttpCode(HttpStatus.OK)
  async logoutAll(@Req() req: Request) {
    const userId = req.session.userId;
    if (!userId) {
      return { message: 'Already logged out from all devices' };
    }

    const count = await this.sessionService.destroyAllUserSessions(userId);
    return { message: `Destroyed ${count} session(s)` };
  }

  private getSafeReturnPath(returnToRaw: string | undefined): string {
    if (!returnToRaw) {
      return '/test';
    }

    if (!returnToRaw.startsWith('/') || returnToRaw.startsWith('//')) {
      return '/test';
    }

    return returnToRaw;
  }

  private createGithubState(input: {
    mode: 'popup' | 'redirect';
    returnTo: string;
  }): string {
    return Buffer.from(JSON.stringify(input), 'utf8').toString('base64url');
  }

  private parseGithubState(stateRaw: string | undefined): {
    mode: 'popup' | 'redirect';
    returnTo: string;
  } {
    if (!stateRaw) {
      return {
        mode: 'redirect',
        returnTo: '/test',
      };
    }

    try {
      const decoded = JSON.parse(
        Buffer.from(stateRaw, 'base64url').toString('utf8'),
      ) as {
        mode?: string;
        returnTo?: string;
      };

      return {
        mode: decoded.mode === 'popup' ? 'popup' : 'redirect',
        returnTo: this.getSafeReturnPath(decoded.returnTo),
      };
    } catch {
      return {
        mode: 'redirect',
        returnTo: '/test',
      };
    }
  }

  private renderGithubPopupResponse(req: Request, returnTo: string): string {
    const origin = `${req.protocol}://${req.get('host')}`;
    const fallbackUrl = new URL(returnTo, origin);
    fallbackUrl.searchParams.set('auth', 'github-success');

    return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>GitHub login completed</title>
  </head>
  <body>
    <script>
      (() => {
        const targetOrigin = ${JSON.stringify(origin)};
        const fallbackPath = ${JSON.stringify(
          fallbackUrl.pathname + fallbackUrl.search,
        )};

        try {
          if (window.opener && !window.opener.closed) {
            window.opener.postMessage(
              { type: 'frogger:github-auth-success' },
              targetOrigin,
            );
            window.close();
            setTimeout(() => {
              if (!window.closed) {
                window.location.replace(fallbackPath);
              }
            }, 200);
            return;
          }
        } catch {
          // Fall back to same-window redirect when opener access is unavailable.
        }

        window.location.replace(fallbackPath);
      })();
    </script>
  </body>
</html>`;
  }
}
