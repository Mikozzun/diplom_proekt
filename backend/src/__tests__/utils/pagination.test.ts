import { parsePagination, buildMeta } from '../../utils/pagination';

describe('Pagination Utilities', () => {
  describe('parsePagination', () => {
    it('returns defaults for no arguments', () => {
      const result = parsePagination();
      expect(result).toEqual({ page: 1, limit: 20, skip: 0 });
    });

    it('parses valid page and limit', () => {
      const result = parsePagination('3', '10');
      expect(result).toEqual({ page: 3, limit: 10, skip: 20 });
    });

    it('clamps page to minimum 1', () => {
      const result = parsePagination('0', '10');
      expect(result.page).toBe(1);
    });

    it('clamps limit to maximum 100', () => {
      const result = parsePagination('1', '200');
      expect(result.limit).toBe(100);
    });

    it('handles invalid strings', () => {
      const result = parsePagination('abc', 'def');
      expect(result).toEqual({ page: 1, limit: 20, skip: 0 });
    });
  });

  describe('buildMeta', () => {
    it('calculates pagination metadata', () => {
      const meta = buildMeta(2, 10, 45);
      expect(meta).toEqual({
        page: 2,
        limit: 10,
        total: 45,
        totalPages: 5,
      });
    });

    it('handles zero total', () => {
      const meta = buildMeta(1, 10, 0);
      expect(meta.totalPages).toBe(0);
    });
  });
});
