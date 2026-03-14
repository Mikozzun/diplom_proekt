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
exports.ReactionsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_js_1 = require("../../prisma/prisma.service.js");
const ALLOWED_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '😡'];
let ReactionsService = class ReactionsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async toggle(postId, userId, dto) {
        const type = dto.reactionType?.trim();
        if (!type) {
            throw new common_1.BadRequestException('Reaction type is required');
        }
        if (!ALLOWED_REACTIONS.includes(type)) {
            throw new common_1.BadRequestException(`Invalid reaction type. Allowed: ${ALLOWED_REACTIONS.join(', ')}`);
        }
        const postBigInt = BigInt(postId);
        const userBigInt = BigInt(userId);
        const post = await this.prisma.post.findUnique({
            where: { id: postBigInt },
        });
        if (!post) {
            throw new common_1.NotFoundException('Post not found');
        }
        const existing = await this.prisma.reaction.findFirst({
            where: {
                userId: userBigInt,
                postId: postBigInt,
                reactionType: type,
            },
        });
        if (existing) {
            await this.prisma.reaction.delete({ where: { id: existing.id } });
            return { reacted: false, reactionType: type };
        }
        await this.prisma.reaction.create({
            data: {
                userId: userBigInt,
                postId: postBigInt,
                reactionType: type,
            },
        });
        return { reacted: true, reactionType: type };
    }
    async remove(postId, userId, reactionType) {
        const existing = await this.prisma.reaction.findFirst({
            where: {
                userId: BigInt(userId),
                postId: BigInt(postId),
                reactionType,
            },
        });
        if (!existing) {
            throw new common_1.NotFoundException('Reaction not found');
        }
        await this.prisma.reaction.delete({ where: { id: existing.id } });
        return { message: 'Reaction removed' };
    }
    async findByPost(postId) {
        const postBigInt = BigInt(postId);
        const post = await this.prisma.post.findUnique({
            where: { id: postBigInt },
        });
        if (!post) {
            throw new common_1.NotFoundException('Post not found');
        }
        const reactions = await this.prisma.reaction.groupBy({
            by: ['reactionType'],
            where: { postId: postBigInt },
            _count: { id: true },
        });
        const grouped = reactions.map((r) => ({
            reactionType: r.reactionType,
            count: r._count.id,
        }));
        return { postId, reactions: grouped };
    }
};
exports.ReactionsService = ReactionsService;
exports.ReactionsService = ReactionsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_js_1.PrismaService])
], ReactionsService);
//# sourceMappingURL=reactions.service.js.map