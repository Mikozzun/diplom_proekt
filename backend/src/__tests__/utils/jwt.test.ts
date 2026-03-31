jest.unmock('../../utils/jwt');

jest.mock('../../config/env', () => ({
  env: {
    jwtSecret: 'test-jwt-secret',
    jwtRefreshSecret: 'test-refresh-secret',
  },
}));

import {
  generateAccessToken,
  generateRefreshToken,
  generateTokenPair,
  verifyAccessToken,
  verifyRefreshToken,
} from '../../utils/jwt';

describe('JWT Utilities', () => {
  it('generates and verifies access tokens', () => {
    const token = generateAccessToken('123');
    const payload = verifyAccessToken(token);
    expect(payload.userId).toBe('123');
    expect(payload.type).toBe('access');
  });

  it('generates and verifies refresh tokens', () => {
    const token = generateRefreshToken('123');
    const payload = verifyRefreshToken(token);
    expect(payload.userId).toBe('123');
    expect(payload.type).toBe('refresh');
  });

  it('generates a token pair', () => {
    const pair = generateTokenPair('123');
    expect(pair.accessToken).toBeDefined();
    expect(pair.refreshToken).toBeDefined();
  });

  it('throws on invalid token', () => {
    expect(() => verifyAccessToken('invalid')).toThrow();
  });
});
