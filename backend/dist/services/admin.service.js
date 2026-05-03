"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.banUser = exports.demoteAdmin = exports.promoteToAdmin = exports.removeRole = exports.assignRole = exports.getAllUsers = exports.getAdminDashboard = void 0;
const database_1 = require("../config/database");
const pagination_1 = require("../utils/pagination");
const getAdminDashboard = async () => {
    const [totalUsers, totalPosts, totalComments, pendingModeration] = await Promise.all([
        database_1.prisma.user.count(),
        database_1.prisma.post.count(),
        database_1.prisma.comment.count(),
        database_1.prisma.moderationQueue.count({ where: { status: 'pending' } }),
    ]);
    return { totalUsers, totalPosts, totalComments, pendingModeration };
};
exports.getAdminDashboard = getAdminDashboard;
const getAllUsers = async (page, limit) => {
    const { page: p, limit: l, skip } = (0, pagination_1.parsePagination)(page, limit);
    const [users, total] = await Promise.all([
        database_1.prisma.user.findMany({
            skip,
            take: l,
            select: {
                id: true,
                username: true,
                phoneNumber: true,
                profileImage: true,
                createdAt: true,
                admin: true,
                userRoles: { include: { role: true } },
            },
        }),
        database_1.prisma.user.count(),
    ]);
    return { users, meta: (0, pagination_1.buildMeta)(p, l, total) };
};
exports.getAllUsers = getAllUsers;
const assignRole = async (userId, roleName) => {
    let role = await database_1.prisma.role.findUnique({ where: { name: roleName } });
    if (!role) {
        role = await database_1.prisma.role.create({ data: { name: roleName } });
    }
    return database_1.prisma.userRole.upsert({
        where: { userId_roleId: { userId, roleId: role.id } },
        update: {},
        create: { userId, roleId: role.id },
    });
};
exports.assignRole = assignRole;
const removeRole = async (userId, roleName) => {
    const role = await database_1.prisma.role.findUnique({ where: { name: roleName } });
    if (!role)
        return;
    return database_1.prisma.userRole.deleteMany({
        where: { userId, roleId: role.id },
    });
};
exports.removeRole = removeRole;
const promoteToAdmin = async (userId) => {
    return database_1.prisma.admin.upsert({
        where: { userId },
        update: {},
        create: { userId },
    });
};
exports.promoteToAdmin = promoteToAdmin;
const demoteAdmin = async (userId) => {
    return database_1.prisma.admin.deleteMany({ where: { userId } });
};
exports.demoteAdmin = demoteAdmin;
const banUser = async (userId) => {
    await database_1.prisma.session.deleteMany({ where: { userId } });
    await database_1.prisma.userActivityLog.create({
        data: { userId, action: 'banned' },
    });
};
exports.banUser = banUser;
//# sourceMappingURL=admin.service.js.map