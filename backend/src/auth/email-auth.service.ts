import {
  Injectable,
  Logger,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class EmailAuthService {
  private readonly SALT_ROUNDS = 10;
  private readonly logger = new Logger(EmailAuthService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Register a new user with email + password.
   */
  async register(email: string, password: string, username: string) {
    this.logger.log(`Register attempt: ${this.maskEmail(email)}`);

    // Check if email is already taken
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      this.logger.warn(
        `Register failed (already exists): ${this.maskEmail(email)}`,
      );
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(password, this.SALT_ROUNDS);

    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        username,
      },
    });

    this.logger.log(
      `Register success: user ${user.id} (${this.maskEmail(user.email ?? '')})`,
    );

    return {
      userId: user.id.toString(),
      email: user.email,
      username: user.username,
    };
  }

  /**
   * Authenticate a user with email + password.
   */
  async login(email: string, password: string) {
    this.logger.log(`Login attempt: ${this.maskEmail(email)}`);

    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) {
      this.logger.warn(`Login failed: ${this.maskEmail(email)}`);
      throw new UnauthorizedException('Invalid email or password');
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      this.logger.warn(`Login failed: ${this.maskEmail(email)}`);
      throw new UnauthorizedException('Invalid email or password');
    }

    this.logger.log(
      `Login success: user ${user.id} (${this.maskEmail(user.email ?? '')})`,
    );

    return {
      userId: user.id.toString(),
      email: user.email!,
      username: user.username,
    };
  }

  private maskEmail(email: string): string {
    const normalized = email.trim().toLowerCase();
    const [local, domain] = normalized.split('@');
    if (!local || !domain) {
      return '[invalid-email]';
    }

    if (local.length <= 2) {
      return `${local[0] ?? '*'}*@${domain}`;
    }

    return `${local[0]}***${local[local.length - 1]}@${domain}`;
  }
}
