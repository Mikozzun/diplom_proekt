jest.mock('../config/database');
jest.mock('../utils/jwt');
jest.mock('@clerk/express', () => ({
  clerkMiddleware: () => (_req: any, _res: any, next: any) => next(),
  getAuth: () => null,
}));

process.env.SESSION_SECRET = 'test-secret';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
process.env.FRONTEND_URL = 'http://localhost:3000';
process.env.CORS_ORIGIN = 'http://localhost:3000';
process.env.NODE_ENV = 'test';
