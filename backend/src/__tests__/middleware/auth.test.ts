import '../helpers/prisma.mock';
import '../helpers/auth.mock';
import { prismaMock } from '../helpers/prisma.mock';

jest.mock('@clerk/express', () => ({
  clerkMiddleware: () => (_req: any, _res: any, next: any) => next(),
  getAuth: jest.fn(),
}));

describe('Auth Middleware', () => {
  const mockReq = (headers: any = {}): any => ({
    headers,
    cookies: {},
  });

  const mockRes = (): any => {
    const res: any = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
  };

  const mockNext = jest.fn();

  beforeEach(() => jest.clearAllMocks());

  it('authenticates with valid JWT', async () => {
    const { verifyAccessToken } = require('../../utils/jwt');
    verifyAccessToken.mockReturnValue({ userId: '1', type: 'access' });

    const { authenticate } = require('../../middleware/auth');
    const req = mockReq({ authorization: 'Bearer valid-token' });
    const res = mockRes();

    await authenticate(req, res, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect((req as any).userId).toEqual(1n);
  });

  it('rejects without token', async () => {
    const { authenticate } = require('../../middleware/auth');
    const req = mockReq();
    const res = mockRes();

    await authenticate(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('checks admin status', async () => {
    const { requireAdmin } = require('../../middleware/auth');

    const req: any = { userId: 1n };
    const res = mockRes();

    prismaMock.admin.findUnique.mockResolvedValue(null);
    await requireAdmin(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('allows admin access', async () => {
    const { requireAdmin } = require('../../middleware/auth');

    const req: any = { userId: 1n };
    const res = mockRes();

    prismaMock.admin.findUnique.mockResolvedValue({ id: 1n });
    await requireAdmin(req, res, mockNext);

    expect(mockNext).toHaveBeenCalled();
  });
});
