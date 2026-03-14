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
exports.LikesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_js_1 = require("../../prisma/prisma.service.js");
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;
let LikesService = class LikesService {
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
        const existing = await this.prisma.like.findFirst({
            where: { userId: userBigInt, postId: postBigInt },
        });
        if (existing) {
            await this.prisma.like.delete({ where: { id: existing.id } });
            return { liked: false };
        }
        await this.prisma.like.create({
            data: { userId: userBigInt, postId: postBigInt },
        });
        return { liked: true };
    }
    async unlike(postId, userId) {
        const existing = await this.prisma.like.findFirst({
            where: { userId: BigInt(userId), postId: BigInt(postId) },
        });
        if (!existing) {
            throw new common_1.NotFoundException('Like not found');
        }
        await this.prisma.like.delete({ where: { id: existing.id } });
        return { message: 'Like removed' };
    }
    async findByPost(postId, options = {}) {
        const postBigInt = BigInt(postId);
        const post = await this.prisma.post.findUnique({
            where: { id: postBigInt },
        });
        if (!post) {
            throw new common_1.NotFoundException('Post not found');
        }
        const take = Math.min(options.limit ?? DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);
        const likes = await this.prisma.like.findMany({
            where: { postId: postBigInt },
            take: take + 1,
            ...(options.cursor && {
                cursor: { id: BigInt(options.cursor) },
                skip: 1,
            }),
            orderBy: { createdAt: 'desc' },
            include: {
                user: { select: { id: true, username: true, profileImage: true } },
            },
        });
        const hasMore = likes.length > take;
        const results = hasMore ? likes.slice(0, take) : likes;
        return {
            data: results.map((l) => this.serialize(l)),
            hasMore,
            nextCursor: results.length > 0 ? results[results.length - 1].id.toString() : null,
        };
    }
    serialize(like) {
        return {
            id: like.id.toString(),
            userId: like.userId?.toString() ?? null,
            postId: like.postId?.toString() ?? null,
            createdAt: like.createdAt,
            user: like.user
                ? {
                    id: like.user.id.toString(),
                    username: like.user.username,
                    profileImage: like.user.profileImage,
                }
                : null,
        };
    }
};
exports.LikesService = LikesService;
exports.LikesService = LikesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_js_1.PrismaService])
], LikesService);
//# sourceMappingURL=likes.service.js.map