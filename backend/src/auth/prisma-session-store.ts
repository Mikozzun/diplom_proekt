import { Store, type SessionData } from 'express-session';
import { PrismaClient } from '@prisma/client';

/**
 * A custom express-session Store backed by PostgreSQL via Prisma.
 * Replaces the need for Redis or any other external session store.
 */
export class PrismaSessionStore extends Store {
  private readonly prisma: PrismaClient;
  private cleanupTimer: ReturnType<typeof setInterval> | null = null;

  constructor(
    prisma: PrismaClient,
    private readonly ttlMs = 7 * 24 * 60 * 60 * 1000,
  ) {
    super();
    this.prisma = prisma;
    // Periodically remove expired sessions (every 15 min)
    this.cleanupTimer = setInterval(
      () => {
        void this.cleanup();
      },
      15 * 60 * 1000,
    );
  }

  /** Read a session from the database */
  get = (
    sid: string,
    callback: (err: any, session?: SessionData | null) => void,
  ): void => {
    this.prisma.session
      .findUnique({ where: { id: sid } })
      .then((row) => {
        if (!row) return callback(null, null);
        if (row.expiresAt < new Date()) {
          // Expired – delete and return nothing
          this.prisma.session.delete({ where: { id: sid } }).catch(() => {});
          return callback(null, null);
        }
        callback(null, JSON.parse(row.data) as SessionData);
      })
      .catch((err) => callback(err));
  };

  /** Write / update a session */
  set = (
    sid: string,
    session: SessionData,
    callback?: (err?: any) => void,
  ): void => {
    const maxAge = session.cookie?.maxAge ?? this.ttlMs;
    const expiresAt = new Date(Date.now() + maxAge);
    const data = JSON.stringify(session);

    this.prisma.session
      .upsert({
        where: { id: sid },
        update: { data, expiresAt },
        create: { id: sid, data, expiresAt },
      })
      .then(() => callback?.())
      .catch((err) => callback?.(err));
  };

  /** Delete a session */
  destroy = (sid: string, callback?: (err?: any) => void): void => {
    this.prisma.session
      .delete({ where: { id: sid } })
      .then(() => callback?.())
      .catch((err: unknown) => {
        // Ignore "not found" errors
        const prismaErr = err as { code?: string } | null;
        if (prismaErr?.code === 'P2025') return callback?.();
        callback?.(err);
      });
  };

  /** Touch – refresh the expiry without changing session data */
  touch = (
    sid: string,
    session: SessionData,
    callback?: (err?: any) => void,
  ): void => {
    const maxAge = session.cookie?.maxAge ?? this.ttlMs;
    const expiresAt = new Date(Date.now() + maxAge);

    this.prisma.session
      .update({ where: { id: sid }, data: { expiresAt } })
      .then(() => callback?.())
      .catch((err) => callback?.(err));
  };

  /** Remove expired sessions */
  private async cleanup(): Promise<void> {
    try {
      await this.prisma.session.deleteMany({
        where: { expiresAt: { lt: new Date() } },
      });
    } catch {
      // non-critical
    }
  }

  /** Stop the cleanup timer (for graceful shutdown) */
  close(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }
}
