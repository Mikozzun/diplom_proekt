export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

export const parsePagination = (
  page?: string,
  limit?: string,
): PaginationParams => {
  const p = Math.max(1, parseInt(page || '1', 10) || 1);
  const l = Math.min(100, Math.max(1, parseInt(limit || '20', 10) || 20));
  return { page: p, limit: l, skip: (p - 1) * l };
};

export const buildMeta = (page: number, limit: number, total: number) => ({
  page,
  limit,
  total,
  totalPages: Math.ceil(total / limit),
});
