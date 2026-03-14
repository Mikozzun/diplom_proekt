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
exports.BookmarksService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_js_1 = require("../../prisma/prisma.service.js");
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;
let BookmarksService = class BookmarksService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async toggle(postId, userId) {
        const postBigInt = BigInt(postId);
        const userBigInt = BigInt(userId);
        const post = await this.prisma.post.findUnique({
            where: { id: postBigInt },
        });
        if (!post) {
            throw new common_1.NotFoundException('Post not found');
        }
        const existing = await this.prisma.bookmark.findFirst({
            where: { userId: userBigInt, postId: postBigInt },
        });
        if (existing) {
            await this.prisma.bookmark.delete({ where: { id: existing.id } });
            return { bookmarked: false };
        }
        await this.prisma.bookmark.create({
            data: { userId: userBigInt, postId: postBigInt },
        });
        return { bookmarked: true };
    }
    async remove(postId, userId) {
        const existing = await this.prisma.bookmark.findFirst({
            where: { userId: BigInt(userId), postId: BigInt(postId) },
        });
        if (!existing) {
            throw new common_1.NotFoundException('Bookmark not found');
        }
        await this.prisma.bookmark.delete({ where: { id: existing.id } });
        return { message: 'Bookmark removed' };
    }
    async findByUser(userId, options = {}) {
        const take = Math.min(options.limit ?? DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);
        const bookmarks = await this.prisma.bookmark.findMany({
            where: { userId: BigInt(userId) },
            take: take + 1,
            ...(options.cursor && {
                cursor: { id: BigInt(options.cursor) },
                skip: 1,
            }),
            orderBy: { createdAt: 'desc' },
            include: {
                post: {
                    include: {
                        user: {
                            select: { id: true, username: true, profileImage: true },
                        },
                        _count: { select: { comments: true, likes: true } },
                    },
                },
            },
        });
        const hasMore = bookmarks.length > take;
        const results = hasMore ? bookmarks.slice(0, take) : bookmarks;
        return {
            data: results.map((b) => this.serialize(b)),
            hasMore,
            nextCursor: results.length > 0 ? results[results.length - 1].id.toString() : null,
        };
    }
    serialize(bookmark) {
        return {
            id: bookmark.id.toString(),
            createdAt: bookmark.createdAt,
            post: bookmark.post
                ? {
                    id: bookmark.post.id.toString(),
                    userId: bookmark.post.userId?.toString() ?? null,
                    content: bookmark.post.content,
                    imageUrl: bookmark.post.imageUrl,
                    videoUrl: bookmark.post.videoUrl,
                    createdAt: bookmark.post.createdAt,
                    author: bookmark.post.user
                        ? {
                            id: bookmark.post.user.id.toString(),
                            username: bookmark.post.user.username,
                            profileImage: bookmark.post.user.profileImage,
                        }
                        : null,
                    commentCount: bookmark.post._count?.comments ?? 0,
                    likeCount: bookmark.post._count?.likes ?? 0,
                }
                : null,
        };
    }
};
exports.BookmarksService = BookmarksService;
exports.BookmarksService = BookmarksService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_js_1.PrismaService])
], BookmarksService);
//# sourceMappingURL=bookmarks.service.js.map