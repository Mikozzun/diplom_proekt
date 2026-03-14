import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { createHash, createHmac } from 'node:crypto';
import { PrismaService } from '../../prisma/prisma.service.js';

export interface TelegramAuthData {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

@Injectable()
export class TelegramAuthService {
  private readonly logger = new Logger(TelegramAuthService.name);
  private readonly botToken = process.env.TELEGRAM_BOT_TOKEN ?? '';
  private readonly botUsername =
    process.env.TELEGRAM_BOT_USERNAME ?? 'frogger_authbot';
  private readonly codeTtlMs = 5 * 60 * 1000;
  private readonly botBaseUrl =
    process.env.TELEGRAM_BOT_INTERNAL_URL ??
    `http://127.0.0.1:${process.env.BOT_PORT ?? '3001'}`;

  constructor(private readonly prisma: PrismaService) {}

  async createLoginCode() {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const ttlSeconds = Math.floor(this.codeTtlMs / 1000);
    await this.registerCodeInBot(code, ttlSeconds);

    return {
      code,
      expiresInSeconds: ttlSeconds,
      botStartUrl: `https://t.me/${this.botUsername}?start=login_${code}`,
      instruction:
        'Open the bot link, press Start (or send /start login_CODE), then verify the same code here.',
    };
  }

  async authenticateWithCode(code: string) {
    const matchedUser = await this.consumeCodeFromBot(code);

    if (!matchedUser?.id) {
      throw new UnauthorizedException(
        'Code not confirmed by bot yet. Open the bot link and press Start, then retry.',
      );
    }

    return this.upsertTelegramUser({
      id: matchedUser.id,
      username: matchedUser.username,
      first_name: matchedUser.first_name,
      last_name: matchedUser.last_name,
      photo_url: matchedUser.photo_url,
    });
  }

  verifyAuth(data: TelegramAuthData): boolean {
    const { hash, ...rest } = data;

    // Build data-check-string
    const checkString = Object.keys(rest)
      .sort()
      .map((key) => `${key}=${rest[key as keyof typeof rest]}`)
      .join('\n');

    // secret_key = SHA256(bot_token)
    const secretKey = createHash('sha256').update(this.botToken).digest();

    // hash = HMAC-SHA-256(data_check_string, secret_key)
    const hmac = createHmac('sha256', secretKey)
      .update(checkString)
      .digest('hex');

    return hmac === hash;
  }

  /**
   * Authenticate via Telegram Login Widget.
   * Verifies hash, checks auth_date freshness, and upserts user.
   */
  async authenticate(data: TelegramAuthData) {
    // Verify hash
    if (!this.verifyAuth(data)) {
      throw new UnauthorizedException('Invalid Telegram auth data');
    }

    // Check that auth_date is not too old (within 5 minutes)
    const now = Math.floor(Date.now() / 1000);
    if (now - data.auth_date > 300) {
      throw new UnauthorizedException('Telegram auth data expired');
    }

    return this.upsertTelegramUser(data);
  }

  private async upsertTelegramUser(data: {
    id: number;
    username?: string;
    first_name?: string;
    last_name?: string;
    photo_url?: string;
  }) {
    const telegramId = data.id.toString();
    const displayName =
      data.username ??
      [data.first_name, data.last_name].filter(Boolean).join(' ') ??
      `tg_${data.id}`;

    let user = await this.prisma.user.findUnique({ where: { telegramId } });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          telegramId,
          username: displayName,
          profileImage: data.photo_url ?? null,
        },
      });
    }

    this.logger.log(`Telegram login: user ${user.id} (${displayName})`);

    return {
      userId: user.id.toString(),
      email: user.email,
      username: user.username,
    };
  }

  private async registerCodeInBot(code: string, ttlSeconds: number) {
    const payload = await this.callBotApi('/codes/register', {
      code,
      ttlSeconds,
    });

    if (!payload?.ok) {
      throw new UnauthorizedException(
        payload?.message ?? 'Failed to register Telegram login code',
      );
    }
  }

  private async consumeCodeFromBot(code: string) {
    const payload = await this.callBotApi('/codes/consume', { code });
    if (!payload?.ok) {
      return null;
    }

    return payload.user as {
      id: number;
      username?: string;
      first_name?: string;
      last_name?: string;
      photo_url?: string;
    };
  }

  private async callBotApi(path: string, body: Record<string, unknown>) {
    if (!this.botToken) {
      throw new UnauthorizedException('Telegram bot token is not configured');
    }

    try {
      const res = await fetch(`${this.botBaseUrl}${path}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(body),
      });

      return (await res.json()) as {
        ok?: boolean;
        user?: unknown;
        message?: string;
      };
    } catch {
      this.logger.error('Telegram bot service is unreachable');
      throw new UnauthorizedException(
        'Telegram bot service is unavailable. Please try again in a few seconds.',
      );
    }
  }
}
