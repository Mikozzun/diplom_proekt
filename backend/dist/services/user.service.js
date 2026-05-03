"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUser = exports.updateUserSettings = exports.getUserSettings = exports.getUserProfile = exports.updateUser = exports.getUserById = void 0;
const database_1 = require("../config/database");
const getUserById = async (id) => {
    return database_1.prisma.user.findUnique({
        where: { id },
        select: {
            id: true,
            username: true,
            phoneNumber: true,
            profileImage: true,
            createdAt: true,
        },
    });
};
exports.getUserById = getUserById;
const updateUser = async (id, data) => {
    return database_1.prisma.user.update({
        where: { id },
        data,
        select: {
            id: true,
            username: true,
            phoneNumber: true,
            profileImage: true,
            createdAt: true,
        },
    });
};
exports.updateUser = updateUser;
const getUserProfile = async (id) => {
    const user = await database_1.prisma.user.findUnique({
        where: { id },
        select: {
            id: true,
            username: true,
            profileImage: true,
            createdAt: true,
            _count: { select: { posts: true, comments: true, likes: true } },
        },
    });
    return user;
};
exports.getUserProfile = getUserProfile;
const getUserSettings = async (userId) => {
    return database_1.prisma.userSettings.findUnique({ where: { userId } });
};
exports.getUserSettings = getUserSettings;
const updateUserSettings = async (userId, data) => {
    return database_1.prisma.userSettings.upsert({
        where: { userId },
        update: data,
        create: { userId, ...data },
    });
};
exports.updateUserSettings = updateUserSettings;
const deleteUser = async (id) => {
    return database_1.prisma.user.delete({ where: { id } });
};
exports.deleteUser = deleteUser;
//# sourceMappingURL=user.service.js.map