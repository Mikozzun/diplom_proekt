import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { Request } from 'express';

/**
 * Service for managing user sessions stored in PostgreSQL via Prisma.
 * Provides helpers to create, list, and destroy sessions.
 */
@Injectable()
export class SessionService {
  private readonly logger = new Logger(SessionService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Populate session after successful authentication.
   */
  createSession(req: Request, userId: string, phoneNumber: string): void {
    req.session.userId = userId;
    req.session.phoneNumber = phoneNumber;
    req.session.userAgent = req.headers['user-agent'] ?? 'unknown';
    req.session.ip = req.ip ?? req.socket.remoteAddress;
    req.session.createdAt = Date.now();
  }

  /**
   * List all active sessions for a given user.
   * Queries the sessions table and filters by userId stored in session data.
   */
  async listUserSessions(
    userId: string,
  ): Promise<
    { sessionId: string; userAgent?: string; ip?: string; createdAt?: number }[]
  > {
    const rows = await this.prisma.session.findMany({
      where: { expiresAt: { gt: new Date() } },
    });

    const sessions: {
      sessionId: string;
      userAgent?: string;
      ip?: string;
      createdAt?: number;
    }[] = [];

    for (const row of rows) {
      try {
        const data = JSON.parse(row.data) as Record<string, unknown>;
        if (data.userId === userId) {
          sessions.push({
            sessionId: row.id,
            userAgent: data.userAgent as string | undefined,
            ip: data.ip as string | undefined,
            createdAt: data.createdAt as number | undefined,
          });
        }
      } catch {
        // skip malformed sessions
      }
    }

    return sessions;
  }

  /**
   * Destroy a specific session by its session ID.
   */
  async destroySession(sessionId: string): Promise<boolean> {
    try {
      await this.prisma.session.delete({ where: { id: sessionId } });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Destroy all sessions for a user (full logout).
   */
  async destroyAllUserSessions(userId: string): Promise<number> {
    const rows = await this.prisma.session.findMany({
      where: { expiresAt: { gt: new Date() } },
    });

    let destroyed = 0;

    for (const row of rows) {
      try {
        const data = JSON.parse(row.data) as Record<string, unknown>;
        if (data.userId === userId) {
          await this.prisma.session.delete({ where: { id: row.id } });
          destroyed++;
        }
      } catch {
        // skip
      }
    }

    return destroyed;
  }
}
