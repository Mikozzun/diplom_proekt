import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { SessionGuard } from '../../../../src/auth/guards/session.guard';

describe('SessionGuard', () => {
  let guard: SessionGuard;

  beforeEach(() => {
    guard = new SessionGuard();
  });

  const createMockContext = (
    session: Record<string, unknown>,
  ): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          session,
        }),
      }),
    } as unknown as ExecutionContext;
  };

  it('should return true when session has userId', () => {
    const context = createMockContext({ userId: 'user-42' });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should throw UnauthorizedException when userId is undefined', () => {
    const context = createMockContext({});

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException when userId is null', () => {
    const context = createMockContext({ userId: null });

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException when userId is empty string', () => {
    const context = createMockContext({ userId: '' });

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it('should have correct error message', () => {
    const context = createMockContext({});

    expect(() => guard.canActivate(context)).toThrow('Not authenticated');
  });

  it('should allow access with any truthy userId', () => {
    const context = createMockContext({ userId: '0' }); // "0" is truthy
    expect(guard.canActivate(context)).toBe(true);
  });
});
