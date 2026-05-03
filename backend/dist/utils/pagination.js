"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildMeta = exports.parsePagination = void 0;
const parsePagination = (page, limit) => {
    const p = Math.max(1, parseInt(page || '1', 10) || 1);
    const l = Math.min(100, Math.max(1, parseInt(limit || '20', 10) || 20));
    return { page: p, limit: l, skip: (p - 1) * l };
};
exports.parsePagination = parsePagination;
const buildMeta = (page, limit, total) => ({
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
});
exports.buildMeta = buildMeta;
//# sourceMappingURL=pagination.js.map