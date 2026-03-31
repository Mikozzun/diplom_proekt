import {
  sendSuccess,
  sendError,
  sendPaginated,
  sendCreated,
  sendNoContent,
} from '../../utils/response';

describe('Response Utilities', () => {
  const mockRes = () => {
    const res: any = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    res.send = jest.fn().mockReturnValue(res);
    return res;
  };

  describe('sendSuccess', () => {
    it('sends 200 with data', () => {
      const res = mockRes();
      sendSuccess(res, { id: '1' });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { id: '1' },
      });
    });

    it('serializes BigInt values', () => {
      const res = mockRes();
      sendSuccess(res, { id: 1n });
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { id: '1' },
      });
    });
  });

  describe('sendError', () => {
    it('sends error response', () => {
      const res = mockRes();
      sendError(res, 'Not found', 404);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Not found',
      });
    });

    it('defaults to 400', () => {
      const res = mockRes();
      sendError(res, 'Bad request');
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('sendPaginated', () => {
    it('sends paginated response', () => {
      const res = mockRes();
      const meta = { page: 1, limit: 10, total: 100, totalPages: 10 };
      sendPaginated(res, [{ id: '1' }], meta);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: [{ id: '1' }],
        meta,
      });
    });
  });

  describe('sendCreated', () => {
    it('sends 201', () => {
      const res = mockRes();
      sendCreated(res, { id: '1' });
      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  describe('sendNoContent', () => {
    it('sends 204', () => {
      const res = mockRes();
      sendNoContent(res);
      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.send).toHaveBeenCalled();
    });
  });
});
