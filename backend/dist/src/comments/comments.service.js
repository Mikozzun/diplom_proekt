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
exports.CommentsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_js_1 = require("../../prisma/prisma.service.js");
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;
let CommentsService = class CommentsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(postId, userId, dto) {
        if (!dto.content?.trim()) {
            throw new common_1.BadRequestException('Comment content cannot be empty');
        }
        const post = await this.prisma.post.findUnique({
            where: { id: BigInt(postId) },
        });
        if (!post) {
            throw new common_1.NotFoundException('Post not found');
        }
        const comment = await this.prisma.comment.create({
            data: {
                postId: BigInt(postId),
                userId: BigInt(userId),
                content: dto.content.trim(),
            },
            include: {
                user: { select: { id: true, username: true, profileImage: true } },
            },
        });
        return this.serialize(comment);
    }
    async findByPost(postId, options = {}) {
        const post = await this.prisma.post.findUnique({
            where: { id: BigInt(postId) },
        });
        if (!post) {
            throw new common_1.NotFoundException('Post not found');
        }
        const take = Math.min(options.limit ?? DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);
        const comments = await this.prisma.comment.findMany({
            where: { postId: BigInt(postId) },
            take: take + 1,
            ...(options.cursor && {
                cursor: { id: BigInt(options.cursor) },
                skip: 1,
            }),
            orderBy: { createdAt: 'asc' },
            include: {
                user: { select: { id: true, username: true, profileImage: true } },
            },
        });
        const hasMore = comments.length > take;
        const results = hasMore ? comments.slice(0, take) : comments;
        return {
            data: results.map((c) => this.serialize(c)),
            hasMore,
            nextCursor: results.length > 0 ? results[results.length - 1].id.toString() : null,
        };
    }
    async update(commentId, userId, dto) {
        if (!dto.content?.trim()) {
            throw new common_1.BadRequestException('Comment content cannot be empty');
        }
        const comment = await this.prisma.comment.findUnique({
            where: { id: BigInt(commentId) },
        });
        if (!comment) {
            throw new common_1.NotFoundException('Comment not found');
        }
        if (comment.userId?.toString() !== userId) {
            throw new common_1.ForbiddenException('You can only edit your own comments');
        }
        const updated = await this.prisma.comment.update({
            where: { id: BigInt(commentId) },
            data: {
                content: dto.content.trim(),
                updatedAt: new Date(),
            },
            include: {
                user: { select: { id: true, username: true, profileImage: true } },
            },
        });
        return this.serialize(updated);
    }
    async remove(commentId, userId) {
        const comment = await this.prisma.comment.findUnique({
            where: { id: BigInt(commentId) },
        });
        if (!comment) {
            throw new common_1.NotFoundException('Comment not found');
        }
        if (comment.userId?.toString() !== userId) {
            throw new common_1.ForbiddenException('You can only delete your own comments');
        }
        await this.prisma.comment.delete({ where: { id: BigInt(commentId) } });
        return { message: 'Comment deleted' };
    }
    serialize(comment) {
        return {
            id: comment.id.toString(),
            postId: comment.postId?.toString() ?? null,
            userId: comment.userId?.toString() ?? null,
            content: comment.content,
            createdAt: comment.createdAt,
            updatedAt: comment.updatedAt,
            author: comment.user
                ? {
                    id: comment.user.id.toString(),
                    username: comment.user.username,
                    profileImage: comment.user.profileImage,
                }
                : null,
        };
    }
};
exports.CommentsService = CommentsService;
exports.CommentsService = CommentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_js_1.PrismaService])
], CommentsService);
//# sourceMappingURL=comments.service.js.map