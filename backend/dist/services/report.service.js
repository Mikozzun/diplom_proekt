"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getReports = exports.createReport = void 0;
const database_1 = require("../config/database");
const pagination_1 = require("../utils/pagination");
const createReport = async (userId, reportType, description) => {
    return database_1.prisma.report.create({
        data: { userId, reportType, description },
    });
};
exports.createReport = createReport;
const getReports = async (page, limit) => {
    const { page: p, limit: l, skip } = (0, pagination_1.parsePagination)(page, limit);
    const [reports, total] = await Promise.all([
        database_1.prisma.report.findMany({
            skip,
            take: l,
            orderBy: { createdAt: 'desc' },
            include: {
                user: { select: { id: true, username: true } },
            },
        }),
        database_1.prisma.report.count(),
    ]);
    return { reports, meta: (0, pagination_1.buildMeta)(p, l, total) };
};
exports.getReports = getReports;
//# sourceMappingURL=report.service.js.map