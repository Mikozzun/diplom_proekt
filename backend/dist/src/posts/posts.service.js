"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_js_1 = require("../../prisma/prisma.service.js");
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;
let PostsService = class PostsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(userId, dto) {
        if (!dto.content && !dto.imageUrl && !dto.videoUrl) {
            throw new common_1.BadRequestException('Post must have at least content, image, or video');
        }
        const post = await this.prisma.post.create({
            data: {
                userId: BigInt(userId),
                content: dto.content,
                imageUrl: dto.imageUrl,
                videoUrl: dto.videoUrl,
            },
            include: {
                user: { select: { id: true, username: true, profileImage: true } },
                _count: { select: { comments: true, likes: true } },
            },
        });
        return this.serialize(post);
    }
    async findAll(options = {}) {
        const take = Math.min(options.limit ?? DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);
        const posts = await this.prisma.post.findMany({
            take: take + 1,
            ...(options.cursor && {
                cursor: { id: BigInt(options.cursor) },
                skip: 1,
            }),
            orderBy: { createdAt: 'desc' },
            include: {
                user: { select: { id: true, username: true, profileImage: true } },
                _count: { select: { comments: true, likes: true } },
            },
        });
        const hasMore = posts.length > take;
        const results = hasMore ? posts.slice(0, take) : posts;
        return {
            data: results.map((p) => this.serialize(p)),
            hasMore,
            nextCursor: results.length > 0 ? results[results.length - 1].id.toString() : null,
        };
    }
    async findByUser(targetUserId, options = {}) {
        const take = Math.min(options.limit ?? DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);
        const posts = await this.prisma.post.findMany({
            where: { userId: BigInt(targetUserId) },
            take: take + 1,
            ...(options.cursor && {
                cursor: { id: BigInt(options.cursor) },
                skip: 1,
            }),
            orderBy: { createdAt: 'desc' },
            include: {
                user: { select: { id: true, username: true, profileImage: true } },
                _count: { select: { comments: true, likes: true } },
            },
        });
        const hasMore = posts.length > take;
        const results = hasMore ? posts.slice(0, take) : posts;
        return {
            data: results.map((p) => this.serialize(p)),
            hasMore,
            nextCursor: results.length > 0 ? results[results.length - 1].id.toString() : null,
        };
    }
    async findOne(postId) {
        const post = await this.prisma.post.findUnique({
            where: { id: BigInt(postId) },
            include: {
                user: { select: { id: true, username: true, profileImage: true } },
                _count: { select: { comments: true, likes: true } },
            },
        });
        if (!post) {
            throw new common_1.NotFoundException('Post not found');
        }
        return this.serialize(post);
    }
    async update(postId, userId, dto) {
        const post = await this.prisma.post.findUnique({
            where: { id: BigInt(postId) },
        });
        if (!post) {
            throw new common_1.NotFoundException('Post not found');
        }
        if (post.userId?.toString() !== userId) {
            throw new common_1.ForbiddenException('You can only edit your own posts');
        }
        const updated = await this.prisma.post.update({
            where: { id: BigInt(postId) },
            data: {
                ...(dto.content !== undefined && { content: dto.content }),
                ...(dto.imageUrl !== undefined && { imageUrl: dto.imageUrl }),
                ...(dto.videoUrl !== undefined && { videoUrl: dto.videoUrl }),
                updatedAt: new Date(),
            },
            include: {
                user: { select: { id: true, username: true, profileImage: true } },
                _count: { select: { comments: true, likes: true } },
            },
        });
        return this.serialize(updated);
    }
    async remove(postId, userId) {
        const post = await this.prisma.post.findUnique({
            where: { id: BigInt(postId) },
        });
        if (!post) {
            throw new common_1.NotFoundException('Post not found');
        }
        if (post.userId?.toString() !== userId) {
            throw new common_1.ForbiddenException('You can only delete your own posts');
        }
        await this.prisma.post.delete({ where: { id: BigInt(postId) } });
        return { message: 'Post deleted' };
    }
    serialize(post) {
        return {
            id: post.id.toString(),
            userId: post.userId?.toString() ?? null,
            content: post.content,
            imageUrl: post.imageUrl,
            videoUrl: post.videoUrl,
            createdAt: post.createdAt,
            updatedAt: post.updatedAt,
            author: post.user
                ? {
                    id: post.user.id.toString(),
                    username: post.user.username,
                    profileImage: post.user.profileImage,
                }
                : null,
            commentCount: post._count?.comments ?? 0,
            likeCount: post._count?.likes ?? 0,
        };
    }
};
exports.PostsService = PostsService;
exports.PostsService = PostsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_js_1.PrismaService])
], PostsService);
//# sourceMappingURL=posts.service.js.map