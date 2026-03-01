import { PrismaSessionStore } from '../../../src/auth/prisma-session-store';
import type { SessionData } from 'express-session';

describe('PrismaSessionStore', () => {
  let store: PrismaSessionStore;
  let prisma: {
    session: {
      findUnique: jest.Mock;
      upsert: jest.Mock;
      delete: jest.Mock;
      update: jest.Mock;
      deleteMany: jest.Mock;
    };
  };

  beforeEach(() => {
    prisma = {
      session: {
        findUnique: jest.fn(),
        upsert: jest.fn(),
        delete: jest.fn(),
        update: jest.fn(),
        deleteMany: jest.fn(),
      },
    };

    // Use fake timers to control setInterval without actual delay
    jest.useFakeTimers();

    store = new PrismaSessionStore(prisma as any, 86400000);
  });

  afterEach(() => {
    store.close();
    jest.useRealTimers();
  });

  describe('get', () => {
    it('should return session data for a valid session', (done) => {
      const sessionData: SessionData = {
        cookie: { originalMaxAge: 86400000 } as any,
        userId: 'user-1',
      } as any;

      prisma.session.findUnique.mockResolvedValue({
        id: 'sid-1',
        data: JSON.stringify(sessionData),
        expiresAt: new Date(Date.now() + 86400000),
      });

      store.get('sid-1', (err, session) => {
        expect(err).toBeNull();
        expect(session).toBeDefined();
        expect((session as any).userId).toBe('user-1');
        done();
      });
    });

    it('should return null for a non-existent session', (done) => {
      prisma.session.findUnique.mockResolvedValue(null);

      store.get('sid-missing', (err, session) => {
        expect(err).toBeNull();
        expect(session).toBeNull();
        done();
      });
    });

    it('should return null and delete expired session', (done) => {
      prisma.session.findUnique.mockResolvedValue({
        id: 'sid-expired',
        data: JSON.stringify({ cookie: {} }),
        expiresAt: new Date(Date.now() - 10000), // expired 10s ago
      });
      prisma.session.delete.mockResolvedValue({});

      store.get('sid-expired', (err, session) => {
        expect(err).toBeNull();
        expect(session).toBeNull();
        expect(prisma.session.delete).toHaveBeenCalledWith({
          where: { id: 'sid-expired' },
        });
        done();
      });
    });

    it('should pass database errors to callback', (done) => {
      const dbError = new Error('DB connection lost');
      prisma.session.findUnique.mockRejectedValue(dbError);

      store.get('sid-error', (err) => {
        expect(err).toBe(dbError);
        done();
      });
    });
  });

  describe('set', () => {
    it('should upsert session data', (done) => {
      const session: SessionData = {
        cookie: { originalMaxAge: 3600000, maxAge: 3600000 } as any,
      } as any;
      prisma.session.upsert.mockResolvedValue({});

      store.set('sid-new', session, (err) => {
        expect(err).toBeUndefined();
        expect(prisma.session.upsert).toHaveBeenCalledWith({
          where: { id: 'sid-new' },
          update: {
            data: JSON.stringify(session),
            expiresAt: expect.any(Date),
          },
          create: {
            id: 'sid-new',
            data: JSON.stringify(session),
            expiresAt: expect.any(Date),
          },
        });
        done();
      });
    });

    it('should use default TTL when cookie maxAge is undefined', (done) => {
      const session: SessionData = {
        cookie: { originalMaxAge: null } as any,
      } as any;
      prisma.session.upsert.mockResolvedValue({});
      const before = Date.now();

      store.set('sid-default-ttl', session, (err) => {
        expect(err).toBeUndefined();
        const call = prisma.session.upsert.mock.calls[0][0];
        const expiresAt = call.create.expiresAt as Date;
        // Should be approximately now + 86400000ms (the ttlMs we passed to constructor)
        expect(expiresAt.getTime()).toBeGreaterThanOrEqual(
          before + 86400000 - 1000,
        );
        expect(expiresAt.getTime()).toBeLessThanOrEqual(
          before + 86400000 + 2000,
        );
        done();
      });
    });

    it('should pass errors to callback on upsert failure', (done) => {
      const session: SessionData = {
        cookie: { originalMaxAge: null } as any,
      } as any;
      const dbError = new Error('Write failed');
      prisma.session.upsert.mockRejectedValue(dbError);

      store.set('sid-fail', session, (err) => {
        expect(err).toBe(dbError);
        done();
      });
    });

    it('should not throw when callback is omitted', () => {
      const session: SessionData = {
        cookie: { originalMaxAge: null } as any,
      } as any;
      prisma.session.upsert.mockResolvedValue({});

      // Should not throw
      expect(() => store.set('sid-no-cb', session)).not.toThrow();
    });
  });

  describe('destroy', () => {
    it('should delete the session', (done) => {
      prisma.session.delete.mockResolvedValue({});

      store.destroy('sid-to-delete', (err) => {
        expect(err).toBeUndefined();
        expect(prisma.session.delete).toHaveBeenCalledWith({
          where: { id: 'sid-to-delete' },
        });
        done();
      });
    });

    it('should ignore P2025 (not found) errors', (done) => {
      prisma.session.delete.mockRejectedValue({ code: 'P2025' });

      store.destroy('sid-not-found', (err) => {
        expect(err).toBeUndefined();
        done();
      });
    });

    it('should pass other errors to callback', (done) => {
      const error = { code: 'P2000', message: 'Some other error' };
      prisma.session.delete.mockRejectedValue(error);

      store.destroy('sid-other-err', (err) => {
        expect(err).toBe(error);
        done();
      });
    });
  });

  describe('touch', () => {
    it('should update the expiry of the session', (done) => {
      const session: SessionData = {
        cookie: { originalMaxAge: 7200000, maxAge: 7200000 } as any,
      } as any;
      prisma.session.update.mockResolvedValue({});

      store.touch('sid-touch', session, (err) => {
        expect(err).toBeUndefined();
        expect(prisma.session.update).toHaveBeenCalledWith({
          where: { id: 'sid-touch' },
          data: { expiresAt: expect.any(Date) },
        });
        done();
      });
    });

    it('should pass errors to callback', (done) => {
      const session: SessionData = {
        cookie: { originalMaxAge: null } as any,
      } as any;
      const dbError = new Error('Update failed');
      prisma.session.update.mockRejectedValue(dbError);

      store.touch('sid-touch-fail', session, (err) => {
        expect(err).toBe(dbError);
        done();
      });
    });
  });

  describe('cleanup', () => {
    it('should delete expired sessions on timer tick', async () => {
      prisma.session.deleteMany.mockResolvedValue({ count: 5 });

      // Advance time by 15 minutes to trigger cleanup
      jest.advanceTimersByTime(15 * 60 * 1000);

      // Wait for the microtask queue to process
      await Promise.resolve();

      expect(prisma.session.deleteMany).toHaveBeenCalledWith({
        where: { expiresAt: { lt: expect.any(Date) } },
      });
    });
  });

  describe('close', () => {
    it('should clear the cleanup timer', () => {
      store.close();

      // After close, advancing timers should not trigger cleanup
      prisma.session.deleteMany.mockResolvedValue({ count: 0 });
      jest.advanceTimersByTime(60 * 60 * 1000);

      expect(prisma.session.deleteMany).not.toHaveBeenCalled();
    });

    it('should be safe to call multiple times', () => {
      expect(() => {
        store.close();
        store.close();
      }).not.toThrow();
    });
  });
});
