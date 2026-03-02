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

  constructor(private readonly prisma: PrismaService) {}

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

    const telegramId = data.id.toString();
    const displayName =
      data.username ??
      [data.first_name, data.last_name].filter(Boolean).join(' ') ??
      `tg_${data.id}`;

    // Upsert user by telegramId
    let user = await this.prisma.user.findUnique({
      where: { telegramId },
    });

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
}
