"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPostReactions = exports.removeReaction = exports.addReaction = exports.getUserBookmarks = exports.toggleBookmark = exports.toggleLike = void 0;
const database_1 = require("../config/database");
const toggleLike = async (postId, userId) => {
    const existing = await database_1.prisma.like.findUnique({
        where: { userId_postId: { userId, postId } },
    });
    if (existing) {
        await database_1.prisma.like.delete({ where: { id: existing.id } });
        return { liked: false };
    }
    await database_1.prisma.like.create({ data: { userId, postId } });
    const post = await database_1.prisma.post.findUnique({ where: { id: postId } });
    if (post?.userId && post.userId !== userId) {
        await database_1.prisma.notification.create({
            data: {
                userId: post.userId,
                type: 'like',
                message: 'Someone liked your post',
            },
        });
    }
    return { liked: true };
};
exports.toggleLike = toggleLike;
const toggleBookmark = async (postId, userId) => {
    const existing = await database_1.prisma.bookmark.findUnique({
        where: { userId_postId: { userId, postId } },
    });
    if (existing) {
        await database_1.prisma.bookmark.delete({ where: { id: existing.id } });
        return { bookmarked: false };
    }
    await database_1.prisma.bookmark.create({ data: { userId, postId } });
    return { bookmarked: true };
};
exports.toggleBookmark = toggleBookmark;
const getUserBookmarks = async (userId) => {
    return database_1.prisma.bookmark.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        include: {
            post: {
                include: {
                    user: { select: { id: true, username: true, profileImage: true } },
                    _count: {
                        select: { comments: true, likes: true, reactions: true },
                    },
                },
            },
        },
    });
};
exports.getUserBookmarks = getUserBookmarks;
const addReaction = async (postId, userId, reactionType) => {
    return database_1.prisma.reaction.upsert({
        where: {
            userId_postId_reactionType: { userId, postId, reactionType },
        },
        update: { reactionType },
        create: { userId, postId, reactionType },
    });
};
exports.addReaction = addReaction;
const removeReaction = async (postId, userId, reactionType) => {
    return database_1.prisma.reaction.deleteMany({
        where: { userId, postId, reactionType },
    });
};
exports.removeReaction = removeReaction;
const getPostReactions = async (postId) => {
    const reactions = await database_1.prisma.reaction.groupBy({
        by: ['reactionType'],
        where: { postId },
        _count: { reactionType: true },
    });
    return reactions.map((r) => ({
        type: r.reactionType,
        count: r._count.reactionType,
    }));
};
exports.getPostReactions = getPostReactions;
//# sourceMappingURL=engagement.service.js.map