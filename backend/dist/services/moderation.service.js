"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveModeration = exports.updateModerationStatus = exports.getModerationQueue = exports.addToQueue = void 0;
const database_1 = require("../config/database");
const pagination_1 = require("../utils/pagination");
const addToQueue = async (contentType, contentId) => {
    return database_1.prisma.moderationQueue.create({
        data: { contentType, contentId },
    });
};
exports.addToQueue = addToQueue;
const getModerationQueue = async (status, page, limit) => {
    const { page: p, limit: l, skip } = (0, pagination_1.parsePagination)(page, limit);
    const where = status ? { status } : {};
    const [items, total] = await Promise.all([
        database_1.prisma.moderationQueue.findMany({
            where,
            skip,
            take: l,
            orderBy: { createdAt: 'desc' },
        }),
        database_1.prisma.moderationQueue.count({ where }),
    ]);
    return { items, meta: (0, pagination_1.buildMeta)(p, l, total) };
};
exports.getModerationQueue = getModerationQueue;
const updateModerationStatus = async (id, status) => {
    return database_1.prisma.moderationQueue.update({
        where: { id },
        data: { status },
    });
};
exports.updateModerationStatus = updateModerationStatus;
const resolveModeration = async (id, action) => {
    const item = await database_1.prisma.moderationQueue.findUnique({ where: { id } });
    if (!item)
        throw new Error('Item not found');
    if (action === 'reject') {
        if (item.contentType === 'post') {
            await database_1.prisma.post.delete({ where: { id: item.contentId } });
        }
        else if (item.contentType === 'comment') {
            await database_1.prisma.comment.delete({ where: { id: item.contentId } });
        }
    }
    return database_1.prisma.moderationQueue.update({
        where: { id },
        data: { status: action === 'approve' ? 'approved' : 'rejected' },
    });
};
exports.resolveModeration = resolveModeration;
//# sourceMappingURL=moderation.service.js.map