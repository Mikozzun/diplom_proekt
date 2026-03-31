import { generateAccessToken } from '../../utils/jwt';

jest.mock('../../utils/jwt', () => ({
  generateAccessToken: jest.fn().mockReturnValue('mock-access-token'),
  generateRefreshToken: jest.fn().mockReturnValue('mock-refresh-token'),
  verifyAccessToken: jest.fn().mockReturnValue({ userId: '1', type: 'access' }),
  verifyRefreshToken: jest
    .fn()
    .mockReturnValue({ userId: '1', type: 'refresh' }),
  generateTokenPair: jest.fn().mockReturnValue({
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
  }),
}));

export const mockAuthHeader = { Authorization: 'Bearer mock-access-token' };
