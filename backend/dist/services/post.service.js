"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRandomizedFeed = exports.getUserPosts = exports.deletePost = exports.updatePost = exports.getPostById = exports.getPosts = exports.createPost = void 0;
const database_1 = require("../config/database");
const pagination_1 = require("../utils/pagination");
const createPost = async (userId, data) => {
    const post = await database_1.prisma.post.create({
        data: { ...data, userId },
        include: {
            user: { select: { id: true, username: true, profileImage: true } },
            _count: { select: { comments: true, likes: true, reactions: true } },
        },
    });
    await database_1.prisma.userActivityLog.create({
        data: { userId, action: 'create_post' },
    });
    return post;
};
exports.createPost = createPost;
const getPosts = async (page, limit) => {
    const { page: p, limit: l, skip } = (0, pagination_1.parsePagination)(page, limit);
    const [posts, total] = await Promise.all([
        database_1.prisma.post.findMany({
            skip,
            take: l,
            orderBy: { createdAt: 'desc' },
            include: {
                user: { select: { id: true, username: true, profileImage: true } },
                _count: { select: { comments: true, likes: true, reactions: true } },
            },
        }),
        database_1.prisma.post.count(),
    ]);
    return { posts, meta: (0, pagination_1.buildMeta)(p, l, total) };
};
exports.getPosts = getPosts;
const getPostById = async (id) => {
    return database_1.prisma.post.findUnique({
        where: { id },
        include: {
            user: { select: { id: true, username: true, profileImage: true } },
            _count: { select: { comments: true, likes: true, reactions: true } },
            polls: true,
        },
    });
};
exports.getPostById = getPostById;
const updatePost = async (id, userId, data) => {
    const post = await database_1.prisma.post.findUnique({ where: { id } });
    if (!post || post.userId !== userId)
        throw new Error('Not authorized');
    return database_1.prisma.post.update({
        where: { id },
        data,
        include: {
            user: { select: { id: true, username: true, profileImage: true } },
            _count: { select: { comments: true, likes: true, reactions: true } },
        },
    });
};
exports.updatePost = updatePost;
const deletePost = async (id, userId) => {
    const post = await database_1.prisma.post.findUnique({ where: { id } });
    if (!post || post.userId !== userId)
        throw new Error('Not authorized');
    return database_1.prisma.post.delete({ where: { id } });
};
exports.deletePost = deletePost;
const getUserPosts = async (userId, page, limit) => {
    const { page: p, limit: l, skip } = (0, pagination_1.parsePagination)(page, limit);
    const [posts, total] = await Promise.all([
        database_1.prisma.post.findMany({
            where: { userId },
            skip,
            take: l,
            orderBy: { createdAt: 'desc' },
            include: {
                user: { select: { id: true, username: true, profileImage: true } },
                _count: { select: { comments: true, likes: true, reactions: true } },
            },
        }),
        database_1.prisma.post.count({ where: { userId } }),
    ]);
    return { posts, meta: (0, pagination_1.buildMeta)(p, l, total) };
};
exports.getUserPosts = getUserPosts;
const getRandomizedFeed = async (userId, page, limit) => {
    const { page: p, limit: l, skip } = (0, pagination_1.parsePagination)(page, limit);
    const randomized = await database_1.prisma.userPostRandomization.findMany({
        where: { userId },
        skip,
        take: l,
        orderBy: { randomOrder: 'asc' },
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
    const total = await database_1.prisma.userPostRandomization.count({
        where: { userId },
    });
    const posts = randomized.map((r) => r.post).filter(Boolean);
    return { posts, meta: (0, pagination_1.buildMeta)(p, l, total) };
};
exports.getRandomizedFeed = getRandomizedFeed;
//# sourceMappingURL=post.service.js.map