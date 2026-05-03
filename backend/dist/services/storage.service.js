"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteFile = exports.getUserFiles = exports.createStorageEntry = void 0;
const database_1 = require("../config/database");
const createStorageEntry = async (userId, data) => {
    return database_1.prisma.storage.create({
        data: { ...data, userId },
    });
};
exports.createStorageEntry = createStorageEntry;
const getUserFiles = async (userId) => {
    return database_1.prisma.storage.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
    });
};
exports.getUserFiles = getUserFiles;
const deleteFile = async (id, userId) => {
    const file = await database_1.prisma.storage.findUnique({ where: { id } });
    if (!file || file.userId !== userId)
        throw new Error('Not authorized');
    return database_1.prisma.storage.delete({ where: { id } });
};
exports.deleteFile = deleteFile;
//# sourceMappingURL=storage.service.js.map