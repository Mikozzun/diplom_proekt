"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createNotification = exports.getUnreadCount = exports.markAllAsRead = exports.markAsRead = exports.getUserNotifications = void 0;
const database_1 = require("../config/database");
const pagination_1 = require("../utils/pagination");
const getUserNotifications = async (userId, page, limit) => {
    const { page: p, limit: l, skip } = (0, pagination_1.parsePagination)(page, limit);
    const [notifications, total] = await Promise.all([
        database_1.prisma.notification.findMany({
            where: { userId },
            skip,
            take: l,
            orderBy: { createdAt: 'desc' },
        }),
        database_1.prisma.notification.count({ where: { userId } }),
    ]);
    return { notifications, meta: (0, pagination_1.buildMeta)(p, l, total) };
};
exports.getUserNotifications = getUserNotifications;
const markAsRead = async (id, userId) => {
    return database_1.prisma.notification.updateMany({
        where: { id, userId },
        data: { readAt: new Date() },
    });
};
exports.markAsRead = markAsRead;
const markAllAsRead = async (userId) => {
    return database_1.prisma.notification.updateMany({
        where: { userId, readAt: null },
        data: { readAt: new Date() },
    });
};
exports.markAllAsRead = markAllAsRead;
const getUnreadCount = async (userId) => {
    return database_1.prisma.notification.count({
        where: { userId, readAt: null },
    });
};
exports.getUnreadCount = getUnreadCount;
const createNotification = async (userId, type, message) => {
    return database_1.prisma.notification.create({
        data: { userId, type, message },
    });
};
exports.createNotification = createNotification;
//# sourceMappingURL=notification.service.js.map