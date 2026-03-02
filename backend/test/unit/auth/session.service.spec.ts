import { Test, TestingModule } from '@nestjs/testing';
import { SessionService } from '../../../src/auth/session.service';
import { PrismaService } from '../../../prisma/prisma.service';
import type { Request } from 'express';

describe('SessionService', () => {
  let service: SessionService;
  let prisma: {
    session: {
      findMany: jest.Mock;
      delete: jest.Mock;
    };
  };

  beforeEach(async () => {
    prisma = {
      session: {
        findMany: jest.fn(),
        delete: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [SessionService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<SessionService>(SessionService);
  });

  describe('createSession', () => {
    it('should populate session fields from request', () => {
      const session: Record<string, unknown> = {};
      const req = {
        session,
        headers: { 'user-agent': 'Mozilla/5.0 TestBrowser' },
        ip: '192.168.1.1',
        socket: { remoteAddress: '127.0.0.1' },
      } as unknown as Request;

      service.createSession(req, 'user-123', 'test@example.com');

      expect(session.userId).toBe('user-123');
      expect(session.email).toBe('test@example.com');
      expect(session.userAgent).toBe('Mozilla/5.0 TestBrowser');
      expect(session.ip).toBe('192.168.1.1');
      expect(session.createdAt).toEqual(expect.any(Number));
    });

    it('should fallback to socket.remoteAddress when req.ip is undefined', () => {
      const session: Record<string, unknown> = {};
      const req = {
        session,
        headers: {},
        ip: undefined,
        socket: { remoteAddress: '10.0.0.1' },
      } as unknown as Request;

      service.createSession(req, 'user-456', 'other@example.com');

      expect(session.ip).toBe('10.0.0.1');
    });

    it('should use "unknown" when user-agent header is missing', () => {
      const session: Record<string, unknown> = {};
      const req = {
        session,
        headers: {},
        ip: '1.2.3.4',
        socket: { remoteAddress: '1.2.3.4' },
      } as unknown as Request;

      service.createSession(req, 'user-789', 'user@example.com');

      expect(session.userAgent).toBe('unknown');
    });
  });

  describe('listUserSessions', () => {
    it('should return sessions belonging to the given user', async () => {
      const now = Date.now();
      prisma.session.findMany.mockResolvedValue([
        {
          id: 'sess-1',
          data: JSON.stringify({
            userId: 'user-42',
            userAgent: 'Chrome',
            ip: '1.1.1.1',
            createdAt: now,
          }),
          expiresAt: new Date(Date.now() + 86400000),
        },
        {
          id: 'sess-2',
          data: JSON.stringify({ userId: 'user-99' }),
          expiresAt: new Date(Date.now() + 86400000),
        },
        {
          id: 'sess-3',
          data: JSON.stringify({
            userId: 'user-42',
            userAgent: 'Firefox',
            ip: '2.2.2.2',
            createdAt: now - 1000,
          }),
          expiresAt: new Date(Date.now() + 86400000),
        },
      ]);

      const sessions = await service.listUserSessions('user-42');

      expect(sessions).toHaveLength(2);
      expect(sessions[0].sessionId).toBe('sess-1');
      expect(sessions[0].userAgent).toBe('Chrome');
      expect(sessions[1].sessionId).toBe('sess-3');
      expect(sessions[1].userAgent).toBe('Firefox');
    });

    it('should return empty array when no sessions exist for the user', async () => {
      prisma.session.findMany.mockResolvedValue([]);

      const sessions = await service.listUserSessions('user-nonexistent');

      expect(sessions).toEqual([]);
    });

    it('should skip malformed session data gracefully', async () => {
      prisma.session.findMany.mockResolvedValue([
        {
          id: 'sess-bad',
          data: 'not-valid-json{{{',
          expiresAt: new Date(Date.now() + 86400000),
        },
        {
          id: 'sess-good',
          data: JSON.stringify({
            userId: 'user-1',
            userAgent: 'TestAgent',
          }),
          expiresAt: new Date(Date.now() + 86400000),
        },
      ]);

      const sessions = await service.listUserSessions('user-1');

      expect(sessions).toHaveLength(1);
      expect(sessions[0].sessionId).toBe('sess-good');
    });
  });

  describe('destroySession', () => {
    it('should delete the session and return true', async () => {
      prisma.session.delete.mockResolvedValue({
        id: 'sess-1',
        data: '{}',
        expiresAt: new Date(),
      });

      const result = await service.destroySession('sess-1');

      expect(result).toBe(true);
      expect(prisma.session.delete).toHaveBeenCalledWith({
        where: { id: 'sess-1' },
      });
    });

    it('should return false when session not found', async () => {
      prisma.session.delete.mockRejectedValue(new Error('Record not found'));

      const result = await service.destroySession('sess-nonexistent');

      expect(result).toBe(false);
    });
  });

  describe('destroyAllUserSessions', () => {
    it('should destroy all sessions belonging to the user', async () => {
      prisma.session.findMany.mockResolvedValue([
        {
          id: 'sess-a',
          data: JSON.stringify({ userId: 'user-10' }),
          expiresAt: new Date(Date.now() + 86400000),
        },
        {
          id: 'sess-b',
          data: JSON.stringify({ userId: 'user-10' }),
          expiresAt: new Date(Date.now() + 86400000),
        },
        {
          id: 'sess-c',
          data: JSON.stringify({ userId: 'user-other' }),
          expiresAt: new Date(Date.now() + 86400000),
        },
      ]);
      prisma.session.delete.mockResolvedValue({});

      const count = await service.destroyAllUserSessions('user-10');

      expect(count).toBe(2);
      expect(prisma.session.delete).toHaveBeenCalledTimes(2);
      expect(prisma.session.delete).toHaveBeenCalledWith({
        where: { id: 'sess-a' },
      });
      expect(prisma.session.delete).toHaveBeenCalledWith({
        where: { id: 'sess-b' },
      });
    });

    it('should return 0 when user has no sessions', async () => {
      prisma.session.findMany.mockResolvedValue([]);

      const count = await service.destroyAllUserSessions('user-empty');

      expect(count).toBe(0);
      expect(prisma.session.delete).not.toHaveBeenCalled();
    });

    it('should handle delete errors gracefully and continue', async () => {
      prisma.session.findMany.mockResolvedValue([
        {
          id: 'sess-x',
          data: JSON.stringify({ userId: 'user-5' }),
          expiresAt: new Date(Date.now() + 86400000),
        },
      ]);
      // delete succeeds
      prisma.session.delete.mockResolvedValue({});

      const count = await service.destroyAllUserSessions('user-5');
      expect(count).toBe(1);
    });
  });
});
