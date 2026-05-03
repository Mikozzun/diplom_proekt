"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.recordDailyMetrics = exports.getDailyMetrics = void 0;
const database_1 = require("../config/database");
const getDailyMetrics = async (startDate, endDate) => {
    return database_1.prisma.dailyMetrics.findMany({
        where: { date: { gte: startDate, lte: endDate } },
        orderBy: { date: 'asc' },
    });
};
exports.getDailyMetrics = getDailyMetrics;
const recordDailyMetrics = async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const [newUsers, postsCreated, commentsMade] = await Promise.all([
        database_1.prisma.user.count({
            where: { createdAt: { gte: today, lt: tomorrow } },
        }),
        database_1.prisma.post.count({
            where: { createdAt: { gte: today, lt: tomorrow } },
        }),
        database_1.prisma.comment.count({
            where: { createdAt: { gte: today, lt: tomorrow } },
        }),
    ]);
    const activeUsers = await database_1.prisma.userActivityLog.groupBy({
        by: ['userId'],
        where: { timestamp: { gte: today, lt: tomorrow } },
    });
    return database_1.prisma.dailyMetrics.upsert({
        where: { date: today },
        update: {
            newUsers,
            postsCreated,
            commentsMade,
            activeUsers: activeUsers.length,
        },
        create: {
            date: today,
            newUsers,
            postsCreated,
            commentsMade,
            activeUsers: activeUsers.length,
        },
    });
};
exports.recordDailyMetrics = recordDailyMetrics;
//# sourceMappingURL=metrics.service.js.map