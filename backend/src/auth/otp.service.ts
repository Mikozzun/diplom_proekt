import { Injectable, Logger } from '@nestjs/common';
import { randomInt } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);

  /** OTP codes are valid for 5 minutes */
  private readonly OTP_TTL_MS = 5 * 60 * 1000;

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generate a 6-digit OTP, persist it, and "send" it.
   * In production, integrate an SMS provider (Twilio, etc.) here.
   */
  async sendOtp(phoneNumber: string): Promise<{ message: string }> {
    const code = this.generateCode();
    const expiresAt = new Date(Date.now() + this.OTP_TTL_MS);

    await this.prisma.otpChallenge.create({
      data: { phoneNumber, code, expiresAt },
    });

    // ── Replace with real SMS delivery ──
    this.logger.log(`[DEV] OTP for ${phoneNumber}: ${code}`);

    return { message: 'OTP sent successfully' };
  }

  /**
   * Verify an OTP code.  Returns `true` if valid, throws otherwise.
   */
  async verifyOtp(phoneNumber: string, code: string): Promise<boolean> {
    const challenge = await this.prisma.otpChallenge.findFirst({
      where: {
        phoneNumber,
        code,
        verified: false,
        expiresAt: { gte: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!challenge) {
      return false;
    }

    // Mark as verified so it can't be reused
    await this.prisma.otpChallenge.update({
      where: { id: challenge.id },
      data: { verified: true },
    });

    return true;
  }

  /** Cryptographically‑acceptable random 6-digit code */
  private generateCode(): string {
    return randomInt(100_000, 999_999).toString();
  }
}
