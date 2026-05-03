"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteComment = exports.updateComment = exports.getPostComments = exports.createComment = void 0;
const database_1 = require("../config/database");
const pagination_1 = require("../utils/pagination");
const createComment = async (postId, userId, content) => {
    const post = await database_1.prisma.post.findUnique({ where: { id: postId } });
    if (!post)
        throw new Error('Post not found');
    const comment = await database_1.prisma.comment.create({
        data: { content, postId, userId },
        include: {
            user: { select: { id: true, username: true, profileImage: true } },
        },
    });
    if (post.userId && post.userId !== userId) {
        await database_1.prisma.notification.create({
            data: {
                userId: post.userId,
                type: 'comment',
                message: `New comment on your post`,
            },
        });
    }
    return comment;
};
exports.createComment = createComment;
const getPostComments = async (postId, page, limit) => {
    const { page: p, limit: l, skip } = (0, pagination_1.parsePagination)(page, limit);
    const [comments, total] = await Promise.all([
        database_1.prisma.comment.findMany({
            where: { postId },
            skip,
            take: l,
            orderBy: { createdAt: 'desc' },
            include: {
                user: { select: { id: true, username: true, profileImage: true } },
            },
        }),
        database_1.prisma.comment.count({ where: { postId } }),
    ]);
    return { comments, meta: (0, pagination_1.buildMeta)(p, l, total) };
};
exports.getPostComments = getPostComments;
const updateComment = async (id, userId, content) => {
    const comment = await database_1.prisma.comment.findUnique({ where: { id } });
    if (!comment || comment.userId !== userId)
        throw new Error('Not authorized');
    return database_1.prisma.comment.update({
        where: { id },
        data: { content, updatedAt: new Date() },
        include: {
            user: { select: { id: true, username: true, profileImage: true } },
        },
    });
};
exports.updateComment = updateComment;
const deleteComment = async (id, userId) => {
    const comment = await database_1.prisma.comment.findUnique({ where: { id } });
    if (!comment || comment.userId !== userId)
        throw new Error('Not authorized');
    return database_1.prisma.comment.delete({ where: { id } });
};
exports.deleteComment = deleteComment;
//# sourceMappingURL=comment.service.js.map